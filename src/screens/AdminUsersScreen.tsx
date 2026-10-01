import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { ActionErrorBanner, EmptyState, ErrorState, SkeletonList } from '../components/StateViews';
import { PickerSheet } from '../components/PickerSheet';
import { roleLabel } from '../components/Badges';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { api } from '../api/client';
import { describeApiError } from '../auth/AuthContext';
import { c, radius, spacing, status, statusText, type } from '../theme';
import { useT } from '../i18n';
import type { AppUser, Office, Role } from '../api/types';

const ROLES: Role[] = ['admin', 'marketing', 'office_manager', 'sales'];

export default function AdminUsersScreen() {
  const screenPadding = useScreenPadding();
  const t = useT();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleSheetFor, setRoleSheetFor] = useState<AppUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<{ kind: 'active'; user: AppUser } | { kind: 'role'; user: AppUser; role: Role } | null>(null);

  const fetchPage = useCallback((page: number) => api.getUsers(page, 20), []);
  const list = usePaginatedList<AppUser>(fetchPage, []);

  const toggleActive = async (user: AppUser) => {
    setBusyId(user.id);
    setActionError(null);
    try {
      const updated = await api.patchUser(user.id, { is_active: !user.is_active });
      list.updateItem((u) => u.id === user.id, updated);
      setLastFailed(null);
    } catch (e) {
      setActionError(describeApiError(e));
      setLastFailed({ kind: 'active', user });
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (user: AppUser, role: Role) => {
    setBusyId(user.id);
    setActionError(null);
    try {
      const updated = await api.patchUser(user.id, { role });
      list.updateItem((u) => u.id === user.id, updated);
      setRoleSheetFor(null);
      setLastFailed(null);
    } catch (e) {
      // Keep the sheet open on the same user so the failed change can be retried immediately.
      setActionError(describeApiError(e));
      setLastFailed({ kind: 'role', user, role });
    } finally {
      setBusyId(null);
    }
  };

  const retryLastAction = () => {
    if (!lastFailed) return;
    if (lastFailed.kind === 'active') toggleActive(lastFailed.user);
    else changeRole(lastFailed.user, lastFailed.role);
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title={t('admin.title')}
        subtitle={t('admin.subtitle', { count: list.total, s: list.total === 1 ? '' : 's' })}
        right={
          <Pressable onPress={() => setInviteOpen(true)} style={s.inviteBtn}>
            <Text style={s.inviteBtnText}>{t('admin.invite')}</Text>
          </Pressable>
        }
      />

      {!!actionError && (
        <View style={{ paddingHorizontal: screenPadding, marginBottom: spacing.cardGap }}>
          <ActionErrorBanner message={actionError} onRetry={retryLastAction} onDismiss={() => setActionError(null)} />
        </View>
      )}

      {list.status === 'loading' && <SkeletonList />}
      {list.status === 'error' && <ErrorState message={list.error ?? t('admin.loadFailed')} onRetry={list.reload} />}

      {list.status === 'ready' && (
        <FlatList
          data={list.items}
          keyExtractor={(u) => u.id}
          contentContainerStyle={[s.content, { paddingHorizontal: screenPadding, flexGrow: 1 }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={list.refreshing} onRefresh={list.refresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={list.loadMore}
          ListEmptyComponent={
            <EmptyState
              title={t('admin.emptyTitle')}
              body={t('admin.emptyBody')}
              action={{ label: t('admin.inviteSomeone'), onPress: () => setInviteOpen(true) }}
            />
          }
          ListFooterComponent={list.loadingMore ? <Text style={s.loadingMore}>{t('common.loadingMore')}</Text> : null}
          renderItem={({ item: u }) => {
            const role = roleLabel(u.role, t);
            return (
              <View style={[s.card, !u.is_active && { opacity: 0.55 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{u.display_name}</Text>
                  <Text style={s.email}>{u.email}</Text>
                  <Pressable onPress={() => { setActionError(null); setRoleSheetFor(u); }} style={s.roleTag} disabled={busyId === u.id}>
                    <View style={s.roleDot} />
                    <Text style={s.roleTagText}>{role}</Text>
                  </Pressable>
                </View>
                <View style={s.switchCol}>
                  <Switch
                    value={u.is_active}
                    onValueChange={() => toggleActive(u)}
                    disabled={busyId === u.id}
                    trackColor={{ true: status.success, false: c.hairline }}
                    thumbColor={c.textPrimary}
                  />
                  <Text style={s.switchLabel}>{u.is_active ? t('admin.active') : t('admin.disabled')}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <PickerSheet
        visible={!!roleSheetFor}
        title={roleSheetFor ? t('admin.roleFor', { name: roleSheetFor.display_name }) : ''}
        options={ROLES.map((r) => ({ key: r, label: roleLabel(r, t) }))}
        onClose={() => setRoleSheetFor(null)}
        onSelect={(key) => roleSheetFor && changeRole(roleSheetFor, key as Role)}
      />

      <InviteModal
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={(u) => {
          list.prependItem(u);
          setInviteOpen(false);
        }}
      />
    </ScreenContainer>
  );
}

function InviteModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (u: AppUser) => void }) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('sales');
  const [office, setOffice] = useState<Office>('tokyo');
  const [roleSheet, setRoleSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEmail('');
      setName('');
      setRole('sales');
      setOffice('tokyo');
      setErr(null);
    }
  }, [visible]);

  const save = async () => {
    if (!email.trim() || !name.trim()) {
      setErr(t('admin.nameEmailRequired'));
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const user = await api.createUser({ email: email.trim(), display_name: name.trim(), role, office });
      onCreated(user);
    } catch (e) {
      setErr(describeApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={s.modalTitle}>{t('admin.inviteTitle')}</Text>

          <Text style={s.fieldLabel}>{t('admin.nameFieldLabel')}</Text>
          <TextInput value={name} onChangeText={setName} style={s.fieldInput} placeholderTextColor="#7B818D" placeholder={t('admin.fullNamePlaceholder')} />

          <Text style={[s.fieldLabel, { marginTop: 12 }]}>{t('admin.emailFieldLabel')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={s.fieldInput}
            placeholderTextColor="#7B818D"
            placeholder="name@exceed-re.ae"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[s.fieldLabel, { marginTop: 12 }]}>{t('admin.roleFieldLabel')}</Text>
          <Pressable onPress={() => setRoleSheet(true)} style={s.selectBtn}>
            <View style={s.selectDot} />
            <Text style={s.selectBtnText}>{roleLabel(role, t)}</Text>
          </Pressable>

          <Text style={[s.fieldLabel, { marginTop: 12 }]}>{t('admin.officeFieldLabel')}</Text>
          <View style={s.officeRow}>
            {(['tokyo', 'dubai'] as Office[]).map((o) => (
              <Pressable key={o} onPress={() => setOffice(o)} style={[s.officeChip, office === o && s.officeChipActive]}>
                <View style={[s.officeDot, office === o && s.officeDotActive]} />
                <Text style={[s.officeChipText, office === o && s.officeChipTextActive]}>{o === 'tokyo' ? t('team.officeTokyo') : t('team.officeDubai')}</Text>
              </Pressable>
            ))}
          </View>

          {!!err && <Text style={s.modalError}>{err}</Text>}

          <View style={s.modalActions}>
            <Pressable onPress={onClose} style={s.modalCancelBtn} disabled={saving}>
              <Text style={s.modalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={save} style={[s.modalConfirmBtn, saving && { opacity: 0.6 }]} disabled={saving}>
              <Text style={s.modalConfirmText}>{saving ? t('admin.inviting') : t('admin.sendInvite')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>

      <PickerSheet
        visible={roleSheet}
        title={t('admin.role')}
        options={ROLES.map((r) => ({ key: r, label: roleLabel(r, t) }))}
        onClose={() => setRoleSheet(false)}
        onSelect={(key) => {
          setRole(key as Role);
          setRoleSheet(false);
        }}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 60 },
  loadingMore: { color: c.micro, ...type.micro, textAlign: 'center', paddingVertical: 16 },
  inviteBtn: { minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: c.yellow, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  inviteBtnText: { color: c.page, ...type.pill },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginBottom: spacing.cardGap },
  name: { color: c.textPrimary, ...type.primary },
  email: { color: c.textSecondary, ...type.secondary, marginTop: 3 },
  roleTag: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.yellow },
  roleTagText: { color: c.textPrimary, ...type.pill },
  switchCol: { alignItems: 'center', marginLeft: spacing.md },
  switchLabel: { color: c.micro, ...type.micro, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: c.card, borderRadius: radius.card, borderWidth: 1, borderColor: c.hairline, padding: spacing.card },
  modalTitle: { color: c.textPrimary, ...type.sectionTitle },
  fieldLabel: { color: c.micro, ...type.micro },
  fieldInput: { marginTop: 6, height: 44, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, backgroundColor: c.raised, color: c.textPrimary, paddingHorizontal: 12, ...type.secondary },
  selectBtn: { marginTop: 6, height: 44, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 12 },
  selectDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.yellow },
  selectBtnText: { color: c.textPrimary, ...type.secondary },
  officeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  officeChip: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  officeChipActive: { backgroundColor: c.raised, borderColor: '#FFD84D66' },
  officeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.micro },
  officeDotActive: { backgroundColor: c.yellow },
  officeChipText: { color: c.textSecondary, ...type.pill },
  officeChipTextActive: { color: c.textPrimary },
  modalError: { color: statusText.danger, ...type.pill, marginTop: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancelBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline },
  modalCancelText: { color: c.textPrimary, ...type.pill },
  modalConfirmBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radius.pill, backgroundColor: c.yellow },
  modalConfirmText: { color: c.page, ...type.pill },
});
