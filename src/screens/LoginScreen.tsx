import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { c, COMPANY_DOMAIN, status as statusColor, VERSION } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { MOCKS_ENABLED } from '../api/client';
import { DEV_AUTH_ENABLED } from '../auth/devauth';
import { useLanguage, useT, type Lang } from '../i18n';

/** Google's four-colour G. Mark must not be recoloured — brand requirement. */
function GoogleG({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12Z"
        fill="none"
        stroke="#747B88"
        strokeWidth={1.7}
      />
      <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" stroke="#747B88" strokeWidth={1.7} />
      {off && <Path d="M4 20 20 4" stroke="#747B88" strokeWidth={1.7} strokeLinecap="round" />}
    </Svg>
  );
}

/** Single-language button label — replaces the old always-both-languages `Label`. */
function Label({ text, color }: { text: string; color: string }) {
  return (
    <View style={s.label}>
      <Text style={[s.labelText, { color }]}>{text}</Text>
    </View>
  );
}

/** Small English/日本語 switch — also lets someone pick a language before signing in (mirrored in
 * Settings for after sign-in). Deliberately compact so it doesn't compete with the two doors. */
function LanguageSwitch() {
  const [lang, setLang] = useLanguage();
  const options: { key: Lang; label: string }[] = [
    { key: 'en', label: 'English' },
    { key: 'ja', label: '日本語' },
  ];
  return (
    <View style={s.langRow} accessibilityRole="radiogroup" accessibilityLabel="Language">
      {options.map((opt, i) => {
        const active = lang === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => setLang(opt.key)}
            style={[s.langChip, i === 0 && { marginRight: 6 }, active && s.langChipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.langChipText, active && s.langChipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const t = useT();

  const { signInWithGoogle, signInWithEmail, authError } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePw, setHidePw] = useState(true);
  const [focused, setFocused] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sheet = useRef(new Animated.Value(0)).current;

  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      // authError from context renders the message; nothing else to do here.
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch {
      // authError from context renders the message.
    } finally {
      setSubmitting(false);
    }
  };

  const openSheet = (open: boolean) => {
    setShowEmail(open);
    Animated.timing(sheet, {
      toValue: open ? 1 : 0,
      duration: open ? 260 : 200,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  // The column never stretches on iPad — it stays phone-width and centres.
  const col = isTablet ? { width: 440, alignSelf: 'center' as const } : null;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <View style={[s.wordmark, isTablet && { top: 96, left: 56 }]}>
        <Text style={s.wordmarkExceed}>EXCEED</Text>
        <Text style={s.wordmarkBox}>BOX</Text>
      </View>

      <View style={[s.langWrap, isTablet && { top: 96, right: 56 }]}>
        <LanguageSwitch />
      </View>

      <View style={[s.headlineWrap, isTablet && { top: 190, left: 56 }]}>
        <Text style={[s.headline, isTablet && { fontSize: 68 }]}>
          {t('login.headlinePre')}
          <Text style={{ color: c.yellow }}>{t('login.headlineBrand')}</Text>
        </Text>
      </View>

      {/* Two doors, docked low. Google dominant, email clearly secondary but not hidden. */}
      <Animated.View
        pointerEvents={showEmail ? 'none' : 'auto'}
        style={[
          s.actions,
          col,
          {
            opacity: sheet.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) }],
          },
        ]}
      >
        <Pressable
          onPress={handleGoogle}
          disabled={googleBusy}
          style={({ pressed }) => [s.btn, s.btnGoogle, (pressed || googleBusy) && s.pressed]}
        >
          <View style={s.btnRow}>
            <GoogleG />
            <Label text={googleBusy ? t('login.signingIn') : t('login.googleContinue')} color={c.charcoal} />
          </View>
        </Pressable>
        <Text style={s.accountNote}>{t('login.accountNote')}</Text>
        {!!authError && !showEmail && <Text style={s.authError}>{authError}</Text>}

        <Pressable
          onPress={() => openSheet(true)}
          style={({ pressed }) => [s.btn, s.btnOutline, { marginTop: 18 }, pressed && s.pressedOutline]}
        >
          <View style={s.btnRow}>
            <Label text={t('login.emailSignIn')} color={c.light} />
          </View>
        </Pressable>

        <Text style={s.legal}>{t('login.legal')}</Text>

        {/* Demo builds have no real identity provider. Without this, the way in is invisible —
            both buttons look like they should work and neither explains what to type. */}
        {MOCKS_ENABLED && <Text style={s.demoHint}>{t('login.demoHint')}</Text>}

        {/* Same problem, different build: connected to a live backend with no Supabase project
            yet, "Sign in with email" works but only via the backend's developer signer — say so,
            and say which roster it accepts, rather than letting a blank password field imply
            credentials that do not exist yet. */}
        {!MOCKS_ENABLED && DEV_AUTH_ENABLED && <Text style={s.demoHint}>{t('login.devAuthHint')}</Text>}
      </Animated.View>

      {/* Email sheet — slides up over the actions. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents={showEmail ? 'auto' : 'none'}
        style={s.sheetHost}
      >
        <Animated.View
          style={[
            s.sheet,
            isTablet && { width: 472, alignSelf: 'center' },
            {
              opacity: sheet,
              transform: [{ translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [520, 0] }) }],
            },
          ]}
        >
          <View style={s.sheetHead}>
            <View>
              <Text style={s.sheetTitle}>{t('login.signInTitle')}</Text>
            </View>
            <Pressable onPress={() => openSheet(false)} style={s.close} hitSlop={8}>
              <Text style={s.closeX}>×</Text>
            </Pressable>
          </View>

          <Text style={s.fieldLabel}>{t('login.emailLabel')}</Text>
          <View style={[s.input, focused === 'email' && s.inputFocus]}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder={`name@${COMPANY_DOMAIN}`}
              placeholderTextColor="#A1A6B0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              style={s.inputText}
            />
          </View>

          <Text style={[s.fieldLabel, { marginTop: 13 }]}>{t('login.passwordLabel')}</Text>
          <View style={[s.input, focused === 'pw' && s.inputFocus]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('pw')}
              onBlur={() => setFocused(null)}
              secureTextEntry={hidePw}
              textContentType="password"
              style={s.inputText}
            />
            <Pressable onPress={() => setHidePw(v => !v)} style={s.eye} hitSlop={8}>
              <EyeIcon off={!hidePw} />
            </Pressable>
          </View>

          {!!authError && showEmail && <Text style={s.authError}>{authError}</Text>}

          <Pressable
            onPress={handleEmailSubmit}
            disabled={!canSubmit || submitting}
            style={({ pressed }) => [
              s.btn,
              s.btnYellow,
              { marginTop: 17 },
              (!canSubmit || submitting) && s.btnDisabled,
              pressed && canSubmit && !submitting && s.pressed,
            ]}
          >
            <View style={s.btnRow}>
              <Label text={submitting ? t('login.signingIn') : t('login.signInButton')} color={c.charcoal} />
            </View>
          </Pressable>

          {/* Self-service reset has no backend yet (Supabase Auth isn't configured in this build) —
              per the acceptance bar, a control with nothing behind it is not shown as a button. */}
          <View style={s.forgot}>
            <Text style={s.forgotEn}>{t('login.forgotPassword')}</Text>
            <Text style={s.forgotNote}>{t('login.forgotNote')}</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      <Text style={s.version}>{VERSION}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.charcoal },

  wordmark: { position: 'absolute', top: 82, left: 28, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  wordmarkExceed: { color: c.yellow, fontSize: 15, fontWeight: '800', letterSpacing: 3 },
  wordmarkBox: { color: c.greyLabel, fontSize: 8, fontWeight: '800', letterSpacing: 1.8 },

  langWrap: { position: 'absolute', top: 82, right: 28 },
  langRow: { flexDirection: 'row' },
  langChip: { minHeight: 30, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: c.outline },
  langChipActive: { backgroundColor: c.yellow, borderColor: c.yellow },
  langChipText: { color: c.muted, fontSize: 11, fontWeight: '700' },
  langChipTextActive: { color: c.charcoal },

  headlineWrap: { position: 'absolute', top: 148, left: 28, right: 28 },
  headline: { color: c.light, fontSize: 47, fontWeight: '800', lineHeight: 47, letterSpacing: -2.4 },

  actions: { position: 'absolute', left: 28, right: 28, bottom: 88 },

  btn: { minHeight: 54, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 16 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
  btnGoogle: { backgroundColor: '#FFFFFF' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.outline },
  btnYellow: { backgroundColor: c.yellow },
  btnDisabled: { opacity: 0.36 },
  pressed: { transform: [{ scale: 0.982 }], opacity: 0.92 },
  pressedOutline: { backgroundColor: c.surface, borderColor: '#717786' },

  label: { alignItems: 'center' },
  labelText: { fontSize: 15, fontWeight: '700' },

  accountNote: { marginTop: 9, color: c.greyNote, textAlign: 'center', fontSize: 10, lineHeight: 14 },
  demoHint: { marginTop: 12, color: c.yellow, textAlign: 'center', fontSize: 10, lineHeight: 15, opacity: 0.85 },
  legal: { marginTop: 17, color: c.greyLegal, textAlign: 'center', fontSize: 9, lineHeight: 13 },

  sheetHost: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 22,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 28,
    backgroundColor: c.surface,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { color: c.light, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#292D36', alignItems: 'center', justifyContent: 'center' },
  closeX: { color: c.muted, fontSize: 23, lineHeight: 26 },

  fieldLabel: { color: c.light, fontSize: 12, fontWeight: '700', marginBottom: 7 },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 53,
    borderWidth: 1,
    borderColor: '#CDD1D9',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingLeft: 14,
  },
  inputFocus: { borderColor: c.gold, borderWidth: 2 },
  inputText: { flex: 1, height: '100%', color: c.charcoal, fontSize: 16 },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  forgot: { alignSelf: 'center', minHeight: 44, paddingVertical: 13, alignItems: 'center' },
  forgotEn: { color: c.light, fontSize: 12, fontWeight: '600' },
  forgotNote: { color: '#6D7280', fontSize: 9, marginTop: 4 },
  authError: { color: statusColor.danger, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 10, lineHeight: 15 },

  version: { position: 'absolute', bottom: 26, left: 0, right: 0, textAlign: 'center', color: c.greyVersion, fontSize: 10, letterSpacing: 0.4 },
});
