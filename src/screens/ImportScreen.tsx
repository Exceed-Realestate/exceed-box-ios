import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { ActionErrorBanner, EmptyState, ForbiddenNotice } from '../components/StateViews';
import { api, MOCKS_ENABLED } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, radius, spacing, status, statusText, type } from '../theme';
import { pickBilingual, useLanguage, useT } from '../i18n';
import type {
  ImportAnalyzeInput,
  ImportAnalyzeParsed,
  ImportCommitResult,
  ImportConsentState,
  ImportMapping,
  ImportSheetChoice,
} from '../api/types';

type Step = 'pick' | 'parsing' | 'analyzing' | 'sheet' | 'mapping' | 'committing' | 'done';

/** Document types the picker offers. `.xlsx`/`.xlsm` are parsed **server-side** (app/csvimport.py
 * + openpyxl) — the app uploads the raw file and never opens a workbook itself, which is why
 * there is no client-side Excel parser anywhere in this tree. `*\/*` stays last because iOS
 * Files and Android SAF both under-report spreadsheet MIME types depending on the source app. */
const PICKER_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel',
  'text/plain',
  '*/*',
];

function isCsvName(name: string): boolean {
  return /\.(csv|txt|tsv)$/i.test(name.trim());
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').trim();
    });
    return row;
  });
  return { headers, rows };
}

export default function ImportScreen() {
  const screenPadding = useScreenPadding();
  const { can } = useAuth();
  const [lang] = useLanguage();
  const t = useT();

  const CONSENT_OPTIONS: { key: ImportConsentState; label: string }[] = [
    { key: 'unknown', label: t('import.consentUnknown') },
    { key: 'granted', label: t('import.consentGranted') },
    { key: 'withdrawn', label: t('import.consentWithdrawn') },
  ];

  const [step, setStep] = useState<Step>('pick');
  const [error, setError] = useState<string | null>(null);
  /** The parsed analysis (columns + questions). Never holds the sheet-choice branch — that lives
   * in `sheetChoice` so every downstream read is a plain object access, not a union narrow. */
  const [analysis, setAnalysis] = useState<ImportAnalyzeParsed | null>(null);
  const [sheetChoice, setSheetChoice] = useState<ImportSheetChoice | null>(null);
  /** The exact input that produced the current analysis, kept so a multi-sheet workbook can be
   * re-sent with `sheet_name` set without asking the user to pick the file again. */
  const [pendingInput, setPendingInput] = useState<ImportAnalyzeInput | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [consentState, setConsentState] = useState<ImportConsentState>('unknown');
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);

  /** One analyze round-trip. Called twice for a multi-sheet workbook: once bare, then again with
   * `sheet_name` after the human answers — the file itself is uploaded both times, because the
   * backend holds no state between the two calls (D11: nothing is parsed before the human answers). */
  const runAnalyze = async (input: ImportAnalyzeInput) => {
    setPendingInput(input);
    setError(null);
    setStep('analyzing');
    try {
      const res = await api.analyzeImport(input);
      if (res.needs_sheet_selection) {
        setSheetChoice(res);
        setAnalysis(null);
        setStep('sheet');
        return;
      }
      const initialMapping: ImportMapping = {};
      res.columns.forEach((col) => {
        if (col.guess) initialMapping[col.key] = col.guess;
      });
      setMapping(initialMapping);
      setAnalysis(res);
      setSheetChoice(null);
      setStep('mapping');
    } catch (e) {
      setError(describeApiError(e));
      setStep('pick');
    }
  };

  const pickFile = async () => {
    setError(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: PICKER_TYPES, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];

    const input: ImportAnalyzeInput = {
      file_name: asset.name,
      file_uri: asset.uri,
      mime_type: asset.mimeType ?? undefined,
    };

    // A real build uploads the file untouched and lets the backend parse it — CSV and Excel alike.
    // The demo/mock build has no server, so it pre-parses CSV text here purely so mocks.ts has rows
    // to fabricate a response from; `.xlsx` in mock mode raises an honest 501 rather than faking it.
    if (MOCKS_ENABLED && isCsvName(asset.name)) {
      setStep('parsing');
      try {
        const content = await FileSystem.readAsStringAsync(asset.uri);
        const { headers, rows } = parseCsv(content);
        if (headers.length === 0 || rows.length === 0) {
          setError(t('import.noRows'));
          setStep('pick');
          return;
        }
        input.rows = rows;
      } catch (e) {
        setError(describeApiError(e));
        setStep('pick');
        return;
      }
    }

    await runAnalyze(input);
  };

  const chooseSheet = async (sheetName: string) => {
    if (!pendingInput) return;
    await runAnalyze({ ...pendingInput, sheet_name: sheetName });
  };

  const unanswered = useMemo(() => (analysis ? analysis.questions.filter((q) => !mapping[q.column_key]) : []), [analysis, mapping]);

  const previewRows = useMemo(() => {
    if (!analysis) return [];
    const mappedFields = ['name', 'email', 'phone', 'company', 'region', 'purpose'];
    return analysis.preview_rows.map((row) => {
      const out: Record<string, string> = {};
      mappedFields.forEach((f) => {
        const colKey = Object.entries(mapping).find(([, v]) => v === f)?.[0];
        out[f] = colKey ? row[colKey] ?? '' : '';
      });
      return out;
    });
  }, [analysis, mapping]);

  const commit = async () => {
    if (!analysis) return;
    setStep('committing');
    setError(null);
    try {
      const res = await api.commitImport({ import_id: analysis.import_id, mapping, consent_state: consentState });
      setCommitResult(res);
      setStep('done');
    } catch (e) {
      setError(describeApiError(e));
      setStep('mapping');
    }
  };

  const startOver = () => {
    setStep('pick');
    setAnalysis(null);
    setSheetChoice(null);
    setPendingInput(null);
    setMapping({});
    setConsentState('unknown');
    setCommitResult(null);
    setError(null);
  };

  if (!can('import.run')) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('import.subtitle')} />
        <ForbiddenNotice message={t('import.forbidden')} />
      </ScreenContainer>
    );
  }

  if (step === 'done' && commitResult) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('import.subtitle')} />
        <View style={{ paddingHorizontal: screenPadding, paddingTop: spacing.xl }}>
          <View style={s.resultCard}>
            <Text style={s.resultTick}>✓</Text>
            <Text style={s.resultTitle}>{t('import.completeTitle')}</Text>
            <View style={s.resultStatRow}>
              <View style={s.resultStat}>
                <Text style={s.resultStatValue}>{commitResult.new_leads}</Text>
                <Text style={s.resultStatLabel}>{t('import.newLeads')}</Text>
              </View>
              <View style={s.resultStat}>
                <Text style={s.resultStatValue}>{commitResult.duplicate_leads}</Text>
                <Text style={s.resultStatLabel}>{t('import.duplicatesSkipped')}</Text>
              </View>
            </View>
            <Text style={s.resultConsent}>{t('import.consentRecorded', { state: commitResult.consent_state })}</Text>
          </View>
          <Pressable onPress={startOver} style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>{t('import.importAnother')}</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer wide>
      <ScreenHeader title={t('import.subtitle')} />
      <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}>
        {(step === 'pick' || step === 'parsing' || step === 'analyzing') && (
          <>
            <EmptyState
              title={t('import.emptyTitle')}
              body={t('import.emptyBody')}
              action={{ label: step === 'pick' ? t('import.chooseFile') : t('import.working'), onPress: step === 'pick' ? pickFile : () => {} }}
            />
            {(step === 'parsing' || step === 'analyzing') && (
              <Text style={s.workingNote}>{step === 'parsing' ? t('import.readingFile') : t('import.analyzingColumns')}</Text>
            )}
            {!!error && (
              <View style={{ marginTop: spacing.cardGap }}>
                <ActionErrorBanner message={error} onRetry={pickFile} onDismiss={() => setError(null)} />
              </View>
            )}
          </>
        )}

        {step === 'sheet' && sheetChoice && (
          <>
            <View style={s.fileBanner}>
              <Text style={s.fileBannerText}>{sheetChoice.file_name}</Text>
              <Text style={s.fileBannerMeta}>{t('import.sheetCount', { count: sheetChoice.sheets.length })}</Text>
            </View>
            <View style={{ marginTop: spacing.section }}>
              <SectionHeader title={t('import.sheetTitle')} count={sheetChoice.sheets.length} />
              <Text style={s.question}>{t('import.sheetBody')}</Text>
              {sheetChoice.sheets.map((name) => (
                <Pressable key={name} onPress={() => chooseSheet(name)} style={s.sheetRow}>
                  <Text style={s.sheetRowText}>{name}</Text>
                  <Text style={s.sheetRowChevron}>›</Text>
                </Pressable>
              ))}
            </View>
            {!!error && (
              <View style={{ marginTop: spacing.cardGap }}>
                <ActionErrorBanner
                  message={error}
                  onRetry={() => pendingInput && runAnalyze(pendingInput)}
                  onDismiss={() => setError(null)}
                />
              </View>
            )}
            <Pressable onPress={startOver} style={[s.secondaryBtn, { marginTop: spacing.section }]}>
              <Text style={s.secondaryBtnText}>{t('import.chooseDifferentFile')}</Text>
            </Pressable>
          </>
        )}

        {(step === 'mapping' || step === 'committing') && analysis && (
          <>
            <View style={s.fileBanner}>
              <Text style={s.fileBannerText}>{analysis.file_name}</Text>
              <Text style={s.fileBannerMeta}>{t('import.rowCount', { count: analysis.row_count })}</Text>
            </View>

            {!!error && (
              <View style={{ marginTop: spacing.cardGap }}>
                <ActionErrorBanner message={error} onRetry={commit} onDismiss={() => setError(null)} />
              </View>
            )}

            <View style={{ marginTop: spacing.section }}>
              <SectionHeader title={t('import.columns')} count={analysis.columns.length} />
              {analysis.columns.map((col) => {
                const question = analysis.questions.find((q) => q.column_key === col.key);
                const currentMap = mapping[col.key];
                return (
                  <View key={col.key} style={s.columnCard}>
                    <Text style={s.columnHeader}>{col.header}</Text>
                    <Text style={s.columnSample}>{t('import.sampleValues', { values: col.sample_values.filter(Boolean).slice(0, 2).join(' · ') || '—' })}</Text>
                    {question ? (
                      <>
                        <Text style={s.question}>{pickBilingual(lang, question.question, question.question_ja)}</Text>
                        <View style={s.optionRow}>
                          {question.options.map((opt) => (
                            <Pressable
                              key={opt.key}
                              onPress={() => setMapping((m) => ({ ...m, [col.key]: opt.key }))}
                              style={[s.optionChip, currentMap === opt.key && s.optionChipActive]}
                            >
                              <Text style={[s.optionChipText, currentMap === opt.key && s.optionChipTextActive]}>
                                {pickBilingual(lang, opt.label, opt.label_ja)}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </>
                    ) : (
                      <View style={s.guessedPill}>
                        <Text style={s.guessedPillText}>{t('import.mappedTo', { target: currentMap ?? t('import.ignore') })}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={{ marginTop: spacing.section }}>
              <SectionHeader title={t('import.preview')} count={previewRows.length} />
              {previewRows.length === 0 ? (
                <Text style={s.previewEmpty}>{t('import.previewEmpty')}</Text>
              ) : (
                previewRows.map((row, i) => (
                  <View key={i} style={s.previewRow}>
                    <Text style={s.previewName}>{row.name || '—'}</Text>
                    <Text style={s.previewMeta}>{[row.email, row.phone, row.company].filter(Boolean).join(' · ') || '—'}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={{ marginTop: spacing.section }}>
              <SectionHeader title={t('import.consent')} />
              <Text style={s.consentWarning}>{t('import.consentWarning')}</Text>
              <View style={s.optionRow}>
                {CONSENT_OPTIONS.map((opt) => (
                  <Pressable key={opt.key} onPress={() => setConsentState(opt.key)} style={[s.optionChip, consentState === opt.key && s.optionChipActive]}>
                    <Text style={[s.optionChipText, consentState === opt.key && s.optionChipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {unanswered.length > 0 && (
              <Text style={s.blockedNote}>{t('import.blockedNote', { count: unanswered.length, s: unanswered.length === 1 ? '' : 's' })}</Text>
            )}

            <Pressable
              onPress={commit}
              disabled={unanswered.length > 0 || step === 'committing'}
              style={[s.primaryBtn, { marginTop: spacing.card }, (unanswered.length > 0 || step === 'committing') && { opacity: 0.5 }]}
            >
              <Text style={s.primaryBtnText}>{step === 'committing' ? t('import.importing') : t('import.importRows', { count: analysis.row_count })}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: 60 },
  workingNote: { color: c.textSecondary, ...type.secondary, textAlign: 'center', marginTop: spacing.card },
  fileBanner: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card },
  fileBannerText: { color: c.textPrimary, ...type.secondary, fontWeight: '600' },
  fileBannerMeta: { color: c.micro, ...type.micro, fontVariant: ['tabular-nums'] },
  columnCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, marginTop: spacing.cardGap },
  columnHeader: { color: c.textPrimary, ...type.primary },
  columnSample: { color: c.micro, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 4 },
  question: { color: c.textSecondary, ...type.secondary, marginTop: spacing.md },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  optionChip: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  optionChipActive: { backgroundColor: '#FFD84D1F', borderColor: '#FFD84D66' },
  optionChipText: { color: c.textSecondary, ...type.pill },
  optionChipTextActive: { color: statusText.warning },
  guessedPill: { alignSelf: 'flex-start', marginTop: spacing.md, backgroundColor: '#1FA36B1A', borderWidth: 1, borderColor: '#1FA36B40', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  guessedPillText: { color: statusText.success, ...type.pill, fontSize: 10 },
  previewEmpty: { color: c.textTertiary, ...type.secondary, marginTop: spacing.card },
  previewRow: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.cardGap },
  previewName: { color: c.textPrimary, ...type.secondary, fontWeight: '600' },
  previewMeta: { color: c.textSecondary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 3 },
  consentWarning: { color: statusText.warning, ...type.secondary, marginTop: spacing.md },
  blockedNote: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: spacing.card, textAlign: 'center' },
  primaryBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.yellow },
  primaryBtnText: { color: c.page, ...type.pill },
  secondaryBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline },
  secondaryBtnText: { color: c.textSecondary, ...type.pill },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: radius.lg,
    padding: spacing.card,
    marginTop: spacing.cardGap,
    minHeight: 48,
  },
  sheetRowText: { color: c.textPrimary, ...type.primary },
  sheetRowChevron: { color: c.textTertiary, fontSize: 22, lineHeight: 22 },
  resultCard: { alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.xl },
  resultTick: { color: statusText.success, fontSize: 30, fontWeight: '700' },
  resultTitle: { color: c.textPrimary, ...type.sectionTitle, marginTop: spacing.md },
  resultStatRow: { flexDirection: 'row', gap: 32, marginTop: spacing.section },
  resultStat: { alignItems: 'center' },
  resultStatValue: { color: c.textPrimary, fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  resultStatLabel: { color: c.micro, ...type.micro, marginTop: 4 },
  resultConsent: { color: c.textSecondary, ...type.secondary, marginTop: spacing.card },
});
