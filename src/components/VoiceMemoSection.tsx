import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioRecorder, useAudioRecorderState, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { c, radius, spacing, status, statusText, type } from '../theme';
import { api } from '../api/client';
import { describeApiError } from '../auth/AuthContext';
import { ActionErrorBanner } from './StateViews';
import type { VoiceMemo } from '../api/types';
import { formatDateTime } from '../utils/dates';
import { useLanguage, useT } from '../i18n';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s2 = Math.round(sec % 60);
  return `${m}:${String(s2).padStart(2, '0')}`;
}

/** SPEC-V2 §10 — 🎤 voice memo. Records with expo-audio, uploads the duration + file, lists notes
 * with duration and author. Transcription is not wired and is never implied to be. */
export function VoiceMemoSection({ leadId }: { leadId: string }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [lang] = useLanguage();
  const t = useT();

  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [status_, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await api.getVoiceMemos(leadId);
      setMemos(res);
      setStatus('ready');
    } catch (e) {
      setError(describeApiError(e));
      setStatus('error');
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const startRecording = async () => {
    setPermissionMessage(null);
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setPermissionMessage(t('voiceMemo.micDenied'));
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    const durationSeconds = recorderState.durationMillis / 1000;
    await recorder.stop();
    if (!recorder.uri || durationSeconds < 1) {
      setError(t('voiceMemo.tooShort'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const memo = await api.createVoiceMemo(leadId, { duration_seconds: durationSeconds, local_uri: recorder.uri });
      setMemos((prev) => [memo, ...prev]);
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      {!!permissionMessage && (
        <View style={s.permBox}>
          <Text style={s.permText}>{permissionMessage}</Text>
        </View>
      )}
      {!!error && (
        <View style={{ marginBottom: spacing.cardGap }}>
          <ActionErrorBanner message={error} onRetry={load} onDismiss={() => setError(null)} />
        </View>
      )}

      <Pressable
        onPress={recorderState.isRecording ? stopRecording : startRecording}
        disabled={saving}
        style={[s.recordBtn, recorderState.isRecording && s.recordBtnActive]}
      >
        <View style={[s.recordDot, recorderState.isRecording && s.recordDotActive]} />
        <Text style={s.recordBtnText}>
          {saving
            ? t('voiceMemo.saving')
            : recorderState.isRecording
              ? t('voiceMemo.stop', { duration: formatDuration(recorderState.durationMillis / 1000) })
              : t('voiceMemo.record')}
        </Text>
      </Pressable>

      {status_ === 'loading' && <Text style={s.loadingNote}>{t('voiceMemo.loading')}</Text>}
      {status_ === 'error' && !error && <ActionErrorBanner message={t('voiceMemo.loadFailed')} onRetry={load} />}
      {status_ === 'ready' && memos.length === 0 && <Text style={s.emptyNote}>{t('voiceMemo.empty')}</Text>}
      {status_ === 'ready' &&
        memos.map((m) => (
          <View key={m.id} style={s.memoRow}>
            <Text style={s.memoIcon}>🎤</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.memoMeta}>
                {formatDuration(m.duration_seconds)} · {m.author_name} · {formatDateTime(m.recorded_at, lang)}
              </Text>
              <Text style={s.memoTranscription}>{t('voiceMemo.transcriptionUnavailable')}</Text>
            </View>
          </View>
        ))}
    </View>
  );
}

const s = StyleSheet.create({
  permBox: { marginBottom: spacing.cardGap, backgroundColor: '#F45B691A', borderWidth: 1, borderColor: '#F45B6940', borderRadius: radius.lg, padding: spacing.card },
  permText: { color: statusText.danger, ...type.secondary },
  recordBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 14, alignSelf: 'flex-start' },
  recordBtnActive: { borderColor: '#F45B6966', backgroundColor: '#F45B691A' },
  recordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.textTertiary },
  recordDotActive: { backgroundColor: status.danger },
  recordBtnText: { color: c.textPrimary, ...type.pill },
  loadingNote: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: spacing.card },
  emptyNote: { color: c.textTertiary, ...type.secondary, marginTop: spacing.card },
  memoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.raised, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.cardGap },
  memoIcon: { fontSize: 16 },
  memoMeta: { color: c.textPrimary, ...type.secondary, fontVariant: ['tabular-nums'] },
  memoTranscription: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 3 },
});
