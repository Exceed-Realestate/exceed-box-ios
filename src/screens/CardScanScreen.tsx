import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { ActionErrorBanner, ForbiddenNotice } from '../components/StateViews';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, radius, spacing, status, statusText, type } from '../theme';
import { useT } from '../i18n';
import type { CardScanFields, ScanLeadResult } from '../api/types';
import {
  guessFields,
  isTextRecognitionAvailable,
  recognizeText,
} from '../../modules/expo-text-recognition/src';

type LooseNav = { navigate: (screen: 'LeadDetail', params: { leadId: string }) => void };

const EMPTY_FIELDS: CardScanFields = { name: '', reading: '', company: '', title: '', email: '', phone: '', address: '' };

export default function CardScanScreen() {
  const screenPadding = useScreenPadding();
  const nav = useNavigation() as unknown as LooseNav;
  const { can } = useAuth();
  const t = useT();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<CardScanFields>(EMPTY_FIELDS);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanLeadResult | null>(null);
  const [reading, setReading] = useState(false);
  const [ocrNote, setOcrNote] = useState<string | null>(null);

  const setField = (k: keyof CardScanFields, v: string) => setFields((f) => ({ ...f, [k]: v }));


  /**
   * On-device text recognition (Vision, iOS). Only fills fields the guesser is confident about —
   * a low-confidence guess comes back empty on purpose, so the form stays blank rather than
   * showing an invented value the person then has to notice and correct.
   */
  const readCard = async (uri: string) => {
    if (!isTextRecognitionAvailable()) {
      setOcrNote(t('cardScan.ocrUnavailable'));
      return;
    }
    setReading(true);
    setOcrNote(null);
    try {
      const { blocks } = await recognizeText(uri);
      const guessed = guessFields(blocks);
      const filled: string[] = [];
      setFields((prev) => {
        const next = { ...prev };
        (Object.keys(guessed) as (keyof CardScanFields)[]).forEach((k) => {
          const g = guessed[k as keyof typeof guessed];
          if (g && g.value && !next[k]) {
            next[k] = g.value;
            filled.push(k);
          }
        });
        return next;
      });
      setOcrNote(filled.length ? t('cardScan.ocrFilled', { n: String(filled.length) }) : t('cardScan.ocrNothing'));
    } catch (e) {
      setOcrNote(describeApiError(e));
    } finally {
      setReading(false);
    }
  };

  const takePhoto = async () => {
    setPermissionMessage(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setPermissionMessage(t('cardScan.cameraDenied'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
      void readCard(res.assets[0].uri);
    }
  };

  const pickFromLibrary = async () => {
    setPermissionMessage(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPermissionMessage(t('cardScan.libraryDenied'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
      void readCard(res.assets[0].uri);
    }
  };

  const reset = () => {
    setImageUri(null);
    setFields(EMPTY_FIELDS);
    setConsent(false);
    setResult(null);
    setSubmitError(null);
    setOcrNote(null);
  };

  const submit = async () => {
    if (!fields.name.trim()) {
      setSubmitError(t('cardScan.nameRequired'));
      return;
    }
    if (!imageUri) {
      // The backend requires an image file on this route (app/api.py: `image: UploadFile = File(...)`)
      // — a text-only submit would always 422, so this is caught here instead.
      setSubmitError(t('cardScan.imageRequired'));
      return;
    }
    if (!consent) {
      setSubmitError(t('cardScan.consentRequired'));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.scanLead({ image_uri: imageUri, fields, consent });
      setResult(res);
    } catch (e) {
      setSubmitError(describeApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!can('card_scan.create')) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('cardScan.title')} />
        <ForbiddenNotice message={t('cardScan.forbidden')} />
      </ScreenContainer>
    );
  }

  if (result) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('cardScan.subtitle')} />
        <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}>
          <View style={s.resultCard}>
            <Text style={s.resultTick}>✓</Text>
            <Text style={s.resultTitle}>{result.deduped ? t('cardScan.matchedExisting') : t('cardScan.leadCreated')}</Text>
            {result.deduped && (
              <Text style={s.resultBody}>{t('cardScan.matchedBody', { matchedOn: result.matched_on ?? t('cardScan.contactInfo') })}</Text>
            )}
            <Text style={s.resultName}>{result.lead.name}</Text>
            {!!result.lead.company && <Text style={s.resultCompany}>{result.lead.company}</Text>}
          </View>
          <View style={s.resultActions}>
            <Pressable onPress={() => nav.navigate('LeadDetail', { leadId: result.lead.id })} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>{t('cardScan.openLead')}</Text>
            </Pressable>
            <Pressable onPress={reset} style={s.secondaryBtn}>
              <Text style={s.secondaryBtnText}>{t('cardScan.scanAnother')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title={t('cardScan.subtitle')} />
      <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}>
        <View style={s.captureRow}>
          <Pressable onPress={takePhoto} style={s.captureBtn}>
            <Text style={s.captureBtnText}>{t('cardScan.takePhoto')}</Text>
          </Pressable>
          <Pressable onPress={pickFromLibrary} style={s.captureBtn}>
            <Text style={s.captureBtnText}>{t('cardScan.chooseLibrary')}</Text>
          </Pressable>
        </View>

        {!!permissionMessage && (
          <View style={s.permBox}>
            <Text style={s.permText}>{permissionMessage}</Text>
          </View>
        )}

        {!!imageUri && <Image source={{ uri: imageUri }} style={s.preview} resizeMode="cover" />}

        <View style={s.notConnectedBox}>
          <Text style={s.notConnectedText}>
            {reading ? t('cardScan.ocrReading') : ocrNote ?? t('cardScan.ocrReady')}
          </Text>
        </View>

        <FieldInput label={t('cardScan.fieldName')} value={fields.name} onChangeText={(v) => setField('name', v)} required />
        <FieldInput label={t('cardScan.fieldReading')} value={fields.reading} onChangeText={(v) => setField('reading', v)} />
        <FieldInput label={t('cardScan.fieldCompany')} value={fields.company} onChangeText={(v) => setField('company', v)} />
        <FieldInput label={t('cardScan.fieldTitle')} value={fields.title} onChangeText={(v) => setField('title', v)} />
        <FieldInput label={t('cardScan.fieldEmail')} value={fields.email} onChangeText={(v) => setField('email', v)} keyboardType="email-address" />
        <FieldInput label={t('cardScan.fieldPhone')} value={fields.phone} onChangeText={(v) => setField('phone', v)} keyboardType="phone-pad" />
        <FieldInput label={t('cardScan.fieldAddress')} value={fields.address} onChangeText={(v) => setField('address', v)} />

        <View style={s.consentRow}>
          <Switch
            value={consent}
            onValueChange={setConsent}
            trackColor={{ false: c.hairline, true: '#3DD68C77' }}
            thumbColor={consent ? status.success : c.textTertiary}
          />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={s.consentText}>{t('cardScan.consentText')}</Text>
          </View>
        </View>

        {!!submitError && (
          <View style={{ marginTop: spacing.cardGap }}>
            <ActionErrorBanner message={submitError} onRetry={submit} onDismiss={() => setSubmitError(null)} />
          </View>
        )}

        <Pressable onPress={submit} disabled={submitting} style={[s.primaryBtn, { marginTop: spacing.card }, submitting && { opacity: 0.6 }]}>
          <Text style={s.primaryBtnText}>{submitting ? t('cardScan.creating') : t('cardScan.createLead')}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  keyboardType,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  required?: boolean;
}) {
  return (
    <View style={{ marginTop: spacing.cardGap }}>
      <Text style={s.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        placeholder="—"
        placeholderTextColor={c.textTertiary}
        autoCapitalize="none"
        style={s.fieldInput}
      />
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: 60 },
  captureRow: { flexDirection: 'row', gap: spacing.cardGap },
  captureBtn: { flex: 1, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', backgroundColor: c.card },
  captureBtnText: { color: c.textPrimary, ...type.pill },
  permBox: { marginTop: spacing.cardGap, backgroundColor: '#F45B691A', borderWidth: 1, borderColor: '#F45B6940', borderRadius: radius.lg, padding: spacing.card },
  permText: { color: statusText.danger, ...type.secondary },
  preview: { width: '100%', height: 180, borderRadius: radius.lg, marginTop: spacing.card, borderWidth: 1, borderColor: c.hairline },
  notConnectedBox: { marginTop: spacing.card, backgroundColor: '#F0B4291A', borderWidth: 1, borderColor: '#F0B42940', borderRadius: radius.lg, padding: spacing.card },
  notConnectedText: { color: statusText.warning, ...type.secondary },
  fieldLabel: { color: c.micro, ...type.micro },
  fieldInput: { marginTop: 6, height: 44, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, backgroundColor: c.raised, color: c.textPrimary, paddingHorizontal: 12, ...type.secondary },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.section, backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card },
  consentText: { color: c.textPrimary, ...type.secondary },
  primaryBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.yellow },
  primaryBtnText: { color: c.page, ...type.pill },
  secondaryBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline, marginTop: spacing.cardGap },
  secondaryBtnText: { color: c.textPrimary, ...type.pill },
  resultCard: { alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.xl, marginTop: spacing.md },
  resultTick: { color: statusText.success, fontSize: 30, fontWeight: '700' },
  resultTitle: { color: c.textPrimary, ...type.sectionTitle, marginTop: spacing.md, textAlign: 'center' },
  resultBody: { color: c.textSecondary, ...type.secondary, marginTop: spacing.card, textAlign: 'center' },
  resultName: { color: c.textPrimary, ...type.primary, marginTop: spacing.card },
  resultCompany: { color: c.textSecondary, ...type.secondary, marginTop: 4 },
  resultActions: { marginTop: spacing.section },
});
