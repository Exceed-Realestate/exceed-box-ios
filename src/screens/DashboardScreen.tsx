import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, ErrorState, SkeletonTiles } from '../components/StateViews';
import { DonutChart, GradientBar, LineChart } from '../components/DashboardCharts';
import { useCountUp } from '../hooks/useCountUp';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, MAX_DASHBOARD_WIDTH, palette, radius, shadow, spacing, status, statusText, type } from '../theme';
import { pickBilingual, useLanguage, useT } from '../i18n';
import type { DashboardStackParamList, RootStackParamList, TabParamList } from '../navigation/types';
import type { DashboardResponse, DashboardTile, LeadSummary, RegionBreakdownItem, SourceBreakdownItem } from '../api/types';

type Nav = NativeStackNavigationProp<DashboardStackParamList, 'Dashboard'>;

const SOURCE_COLORS = [palette.teal.fill, status.info, palette.orange.fill, palette.amber.fill, status.success, palette.violet.fill];
const REGION_COLORS = ['#F0B429', c.textPrimary, status.info, c.textTertiary];

export default function DashboardScreen() {
  const screenPadding = useScreenPadding();
  const { width } = useWindowDimensions();
  const nav = useNavigation<Nav>();
  const { can } = useAuth();
  const t = useT();
  const [screenStatus, setScreenStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Bumping this replays the KPI count-up every time the Dashboard is opened.
  const [runKey, setRunKey] = useState(0);
  useFocusEffect(useCallback(() => { setRunKey((k) => k + 1); }, []));

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setScreenStatus('loading');
    setError(null);
    try {
      const res = await api.getDashboard();
      setData(res);
      setScreenStatus('ready');
    } catch (e) {
      setError(describeApiError(e));
      setScreenStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalLeadsTile = data?.tiles.find((t) => t.key === 'total_leads');
  const isEmpty = !!data && (totalLeadsTile?.value ?? 0) === 0 && data.hot_leads.length === 0;

  // KPI grid: 6 across once there's room for it, 3 across at tablet width, 2 on a phone —
  // mirrors the reference's grid-template-columns:repeat(6,1fr) collapsing to repeat(3,1fr).
  const kpiCols = width >= 1000 ? 6 : width >= 620 ? 3 : 2;
  const isStacked = width < 900; // below this, the 2-column card grid becomes 1 column.

  // Cross-tab navigation: same "go through the root stack's 'Main' screen params" pattern
  // TabNavigator.tsx's own ⌘-shortcut jumpTo() uses, so it can never drift from how the rest of
  // the app already jumps between tabs.
  const goToScoreDetail = () => {
    const rootNav = nav.getParent()?.getParent<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
    rootNav?.navigate('Main', { screen: 'TrackingTab' } as NavigatorScreenParams<TabParamList>);
  };

  return (
    <ScreenContainer wide>
      <ScreenHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      {screenStatus === 'loading' && <SkeletonTiles count={6} />}
      {screenStatus === 'error' && <ErrorState message={error ?? t('dashboard.loadFailed')} onRetry={() => load()} />}

      {screenStatus === 'ready' && data && (
        <ScrollView
          contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}
          refreshControl={<RefreshControl tintColor={c.gold} refreshing={refreshing} onRefresh={() => load(true)} />}
        >
          <View style={s.capWrap}>
            {isEmpty ? (
              <EmptyState title={t('dashboard.emptyTitle')} body={t('dashboard.emptyBody')} />
            ) : (
              <>
                <KpiRow tiles={data.tiles} trend={data.trend} cols={kpiCols} runKey={runKey} />

                <View style={[s.row, isStacked && s.rowStacked]}>
                  {/* Card titles below are Japanese-primary by design, matching the client's reference
                      screenshot exactly (design/UI-DIRECTION.md) — they stay fixed regardless of the
                      active app language, same as the demo they were built from. */}
                  <Card style={[s.flexCard, !isStacked && { flex: 3 }]}>
                    <CardHead title="商談予約・商談数の推移" hint={t('dashboard.hintTrend')} />
                    <TrendCard trend={data.trend} />
                  </Card>
                  <Card style={[s.flexCard, !isStacked && { flex: 2 }]}>
                    <CardHead title="エリア別 商談予約" hint={t('dashboard.hintRegionTotal', { count: data.by_region.reduce((sum, r) => sum + r.count, 0) })} />
                    <RegionDonut byRegion={data.by_region} />
                  </Card>
                </View>

                <View style={[s.row, isStacked && s.rowStacked]}>
                  <Card style={s.flexCard}>
                    <CardHead title="休眠リード再活性ファネル" hint={t('dashboard.hintFunnel')} />
                    <StageFunnel funnel={data.funnel} />
                  </Card>
                  <Card style={s.flexCard}>
                    <CardHead
                      title="🔥 ホットリード — 本日対応"
                      right={
                        can('tracking.view') ? (
                          <Pressable onPress={goToScoreDetail} style={({ pressed }) => [s.ghostBtn, pressed && { opacity: 0.8 }]}>
                            <Text style={s.ghostBtnText}>{t('dashboard.scoreDetail')}</Text>
                          </Pressable>
                        ) : undefined
                      }
                    />
                    <HotLeads leads={data.hot_leads} onPress={(id) => nav.navigate('LeadDetail', { leadId: id })} />
                  </Card>
                </View>

                <View style={[s.row, isStacked && s.rowStacked]}>
                  <Card style={s.flexCard}>
                    <CardHead title="担当者別パフォーマンス" hint={t('dashboard.allTime')} />
                    <RepTable byRep={data.by_rep} />
                  </Card>
                  <Card style={s.flexCard}>
                    <CardHead title="流入元別 商談予約" hint={t('dashboard.cumulative')} />
                    <SourceBars bySource={data.by_source} />
                  </Card>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// KPI row
// ---------------------------------------------------------------------------

function weekOverWeekDelta(points: number[]): { delta: number; window: number } | null {
  if (points.length < 2) return null;
  const w = Math.min(7, Math.floor(points.length / 2));
  if (w < 1) return null;
  const recent = points.slice(points.length - w).reduce((sum, v) => sum + v, 0);
  const prior = points.slice(points.length - 2 * w, points.length - w).reduce((sum, v) => sum + v, 0);
  return { delta: recent - prior, window: w };
}

function KpiRow({
  tiles,
  trend,
  cols,
  runKey,
}: {
  tiles: DashboardTile[];
  trend: DashboardResponse['trend'];
  cols: number;
  runKey: number;
}) {
  const widthPct = `${100 / cols}%` as const;
  return (
    <View style={s.tileGrid}>
      {tiles.map((tile) => (
        <View key={tile.key} style={[s.tileWrap, { width: widthPct }]}>
          <KpiTile tile={tile} trend={trend} runKey={runKey} />
        </View>
      ))}
    </View>
  );
}

function KpiTile({
  tile,
  trend,
  runKey,
}: {
  tile: DashboardTile;
  trend: DashboardResponse['trend'];
  runKey: number;
}) {
  const [lang] = useLanguage();
  const inverted = tile.key === 'expected_revenue';
  // Runs up from 0 and lands on the real figure; replays whenever the screen is focused.
  const shown = useCountUp(tile.value, 900, runKey);
  const label = pickBilingual(lang, tile.label, tile.label_ja);

  return (
    <View style={[s.tile, inverted && s.tileInverted]}>
      <Text style={[s.tileLabel, inverted && s.tileLabelInverted]}>{label}</Text>
      {tile.value === null || shown === null ? (
        <>
          <Text style={[s.tileValueUnavailable, inverted && s.tileValueInverted]}>—</Text>
          {!!tile.unavailable_reason && (
            <Text style={[s.tileSub, inverted && s.tileSubInverted]} numberOfLines={4}>
              {pickBilingual(lang, tile.unavailable_reason, tile.unavailable_reason_ja)}
            </Text>
          )}
        </>
      ) : (
        <>
          <Text
            style={[s.tileValue, inverted && s.tileValueInverted]}
            // the settled value is what matters to a screen reader, not each tick
            accessibilityLabel={`${label} ${tile.value.toLocaleString()}`}
          >
            {tile.key === 'expected_revenue' ? `¥${shown.toLocaleString()}` : shown.toLocaleString()}
          </Text>
          <TileSub tileKey={tile.key} trend={trend} inverted={inverted} />
        </>
      )}
    </View>
  );
}

function TileSub({ tileKey, trend, inverted }: { tileKey: DashboardTile['key']; trend: DashboardResponse['trend']; inverted: boolean }) {
  const t = useT();
  if (tileKey === 'expected_revenue') {
    return <Text style={[s.tileSub, inverted && s.tileSubInverted]}>{t('dashboard.pipelineWeighted')}</Text>;
  }
  if (tileKey === 'first_sends') {
    return <Text style={s.tileSub}>{t('dashboard.leadsWithEmail')}</Text>;
  }
  if (tileKey === 'won') {
    return <Text style={s.tileSub}>{t('dashboard.cumulative')}</Text>;
  }
  const pick =
    tileKey === 'total_leads' ? (p: DashboardResponse['trend'][number]) => p.leads
    : tileKey === 'meetings_booked' ? (p: DashboardResponse['trend'][number]) => p.meetings_booked
    : tileKey === 'in_negotiation' ? (p: DashboardResponse['trend'][number]) => p.in_negotiation
    : null;
  if (!pick) return <Text style={s.tileSub}>{t('dashboard.allTime')}</Text>;
  const d = weekOverWeekDelta(trend.map(pick));
  if (!d) return <Text style={s.tileSub}>{t('dashboard.allTime')}</Text>;
  const arrow = d.delta > 0 ? '▲' : d.delta < 0 ? '▼' : '→';
  const color = d.delta > 0 ? statusText.success : d.delta < 0 ? statusText.danger : c.textTertiary;
  return (
    <Text style={[s.tileSub, { color, fontWeight: '700' }]}>
      {t('dashboard.recentWindowDelta', { arrow, window: d.window, sign: d.delta >= 0 ? '+' : '', delta: d.delta })}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function CardHead({ title, hint, right }: { title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <View style={s.cardHead}>
      <Text style={s.cardTitle}>{title}</Text>
      {right ?? (!!hint && <Text style={s.cardHint}>{hint}</Text>)}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 商談予約・商談数の推移 — trend line chart.
// ---------------------------------------------------------------------------

function TrendCard({ trend }: { trend: DashboardResponse['trend'] }) {
  const t = useT();
  if (trend.length === 0) {
    return <Text style={s.emptyNote}>{t('dashboard.noTrendData')}</Text>;
  }
  const meetingsTotal = trend.reduce((sum, p) => sum + p.meetings_booked, 0);
  const negotiationTotal = trend.reduce((sum, p) => sum + p.in_negotiation, 0);
  const xLabels = trend.map((p) => `${p.date.slice(5, 7)}/${p.date.slice(8, 10)}`);

  // Cumulative series — the reference's chart is a running total ("累計"), not a per-day count.
  let mRunning = 0;
  let nRunning = 0;
  const meetingsCum = trend.map((p) => (mRunning += p.meetings_booked));
  const negotiationCum = trend.map((p) => (nRunning += p.in_negotiation));

  return (
    <View>
      <View style={s.chartLegend}>
        <View style={s.legendItem}>
          <View style={[s.legDot, { backgroundColor: '#F0B429' }]} />
          <Text style={s.legendText}>
            <Text style={s.legendStrong}>{t('dashboard.legendMeetingsBooked')}</Text>
            {t('dashboard.legendCumulativeCount', { count: meetingsTotal })}
          </Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legDot, { backgroundColor: c.textPrimary }]} />
          <Text style={s.legendText}>
            <Text style={s.legendStrong}>{t('dashboard.legendInNegotiation')}</Text>
            {t('dashboard.legendCumulativeCount', { count: negotiationTotal })}
          </Text>
        </View>
      </View>
      <LineChart
        series={[
          { key: 'meetings', color: '#F0B429', points: meetingsCum, area: true },
          { key: 'negotiation', color: c.textPrimary, points: negotiationCum },
        ]}
        xLabels={xLabels}
      />
      <Text style={s.chartFootnote}>{t('dashboard.trendFootnote', { days: trend.length })}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// エリア別 商談予約 — region donut. Honest note: by_region counts every lead in that region, not
// specifically leads that reached "meeting booked" — the API doesn't expose a booked-only breakdown
// by region yet, so this shows the closest real field instead of a fabricated one.
// ---------------------------------------------------------------------------

function RegionDonut({ byRegion }: { byRegion: RegionBreakdownItem[] }) {
  const [lang] = useLanguage();
  const t = useT();
  const present = byRegion.filter((r) => r.count > 0);
  const total = present.reduce((sum, r) => sum + r.count, 0);
  if (total === 0) {
    return <Text style={s.emptyNote}>{t('dashboard.noRegionData')}</Text>;
  }
  const segments = present.map((r, i) => ({
    key: r.region,
    label: pickBilingual(lang, r.label, r.label_ja),
    value: r.count,
    color: REGION_COLORS[i % REGION_COLORS.length],
  }));

  return (
    <View style={s.donutWrap}>
      <DonutChart segments={segments} centerValue={t('dashboard.countSuffix', { count: total })} centerLabel={t('dashboard.donutCenterLabel')} />
      <View style={{ flex: 1 }}>
        {present.map((r, i) => (
          <View key={r.region} style={s.donutRow}>
            <View style={[s.legDot, { backgroundColor: REGION_COLORS[i % REGION_COLORS.length] }]} />
            <Text style={s.donutRowLabel} numberOfLines={1}>
              {pickBilingual(lang, r.label, r.label_ja)}
            </Text>
            <Text style={s.donutRowValue}>{t('dashboard.countSuffix', { count: r.count })}</Text>
          </View>
        ))}
        <Text style={s.cardNote}>{t('dashboard.regionNote')}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 休眠リード再活性ファネル — real pipeline-stage funnel (new → nurturing → engaged → meeting
// booked → in negotiation → won). Honest note: the demo's card shows an email-blast funnel
// (sent/opened/clicked/replied); that per-campaign metric isn't part of /api/dashboard, so this
// renders the closest real funnel that is: how the lead base actually moves through the pipeline.
// ---------------------------------------------------------------------------

function StageFunnel({ funnel }: { funnel: DashboardResponse['funnel'] }) {
  const [lang] = useLanguage();
  const t = useT();
  if (funnel.length === 0) {
    return <Text style={s.emptyNote}>{t('dashboard.noFunnelData')}</Text>;
  }
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));
  const logMax = Math.log10(maxCount + 1) || 1;
  // Unlike an email-blast funnel (necessarily monotonic — you can't click more than you received),
  // pipeline-stage snapshot counts are NOT monotonic (more leads can be "nurturing" right now than
  // "new", since new ones move on). "% of stage 1" would read as a nonsensical >100% for those rows,
  // so this is honestly each stage's share of the whole forward pipeline instead.
  const totalAcrossStages = funnel.reduce((sum, f) => sum + f.count, 0);

  return (
    <View>
      {funnel.map((f) => {
        const widthPct = Math.max(6, (Math.log10(f.count + 1) / logMax) * 100);
        const pct = totalAcrossStages > 0 ? (f.count / totalAcrossStages) * 100 : 0;
        return (
          <View key={f.stage} style={s.funnelRow}>
            <Text style={s.funnelLabel} numberOfLines={1}>
              {pickBilingual(lang, f.label, f.label_ja)}
            </Text>
            <GradientBar widthPct={widthPct} />
            <Text style={s.funnelNum}>{f.count.toLocaleString()}</Text>
            <Text style={s.funnelPct}>{pct < 1 ? pct.toFixed(2) : pct.toFixed(1)}%</Text>
          </View>
        );
      })}
      <Text style={s.cardNote}>{t('dashboard.funnelNote')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 🔥 ホットリード — hot leads with a real stage-derived chip. Honest note: the demo's per-lead "AI:
// 本日中に電話"-style suggestion text isn't generated anywhere in the API — this shows the lead's
// own real activity_note instead of inventing a specific next action.
// ---------------------------------------------------------------------------

function HotLeads({ leads, onPress }: { leads: LeadSummary[]; onPress: (id: string) => void }) {
  const [lang] = useLanguage();
  const t = useT();
  if (leads.length === 0) {
    return <Text style={s.emptyNote}>{t('dashboard.noHotLeads')}</Text>;
  }
  return (
    <View>
      {leads.slice(0, 6).map((lead, i) => {
        const dot = lead.score >= 70 ? palette.orange.fill : lead.score >= 40 ? palette.amber.fill : c.textTertiary;
        const reserved = lead.stage === 'meeting_booked';
        const activity = pickBilingual(lang, lead.activity_note, lead.activity_note_ja);
        const chipText = reserved ? t('dashboard.reserved') : activity || t('dashboard.needsFollowUp');
        const name = pickBilingual(lang, lead.name, lead.name_ja);
        return (
          <Pressable
            key={lead.id}
            onPress={() => onPress(lead.id)}
            style={({ pressed }) => [s.hotRow, i === leads.length - 1 && { borderBottomWidth: 0 }, pressed && { opacity: 0.7 }]}
          >
            <View style={s.scorePill}>
              <View style={[s.scoreDot, { backgroundColor: dot }]} />
              <Text style={s.scoreNum}>{lead.score}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.hotName} numberOfLines={1}>
                {name}
                {lead.company ? `｜${lead.company}` : ''}
              </Text>
              <Text style={s.hotSub} numberOfLines={1}>
                {activity || t('dashboard.noActivityNote')}
              </Text>
            </View>
            {reserved ? (
              <View style={s.reservedChip}>
                <Text style={s.reservedChipText}>{chipText}</Text>
              </View>
            ) : (
              <View style={s.aiChip}>
                <Text style={s.aiChipText} numberOfLines={1}>
                  {t('dashboard.aiPrefix')}
                  {chipText}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 担当者別パフォーマンス — real fields only: 予約(meetings_booked)/成約(won). 商談(in-negotiation
// per rep) and 売上(revenue per rep) aren't in RepPerformance — rendered as "—" honestly.
// ---------------------------------------------------------------------------

function RepTable({ byRep }: { byRep: DashboardResponse['by_rep'] }) {
  const t = useT();
  if (!byRep) {
    return <Text style={s.emptyNote}>{t('dashboard.noPermissionPerRep')}</Text>;
  }
  if (byRep.length === 0) {
    return <Text style={s.emptyNote}>{t('dashboard.noRepData')}</Text>;
  }
  return (
    <View>
      <View style={s.tableHeadRow}>
        <Text style={[s.tableHeadCell, { flex: 1.6 }]}>{t('dashboard.repHeaderName')}</Text>
        <Text style={s.tableHeadCellNum}>{t('dashboard.repHeaderBooked')}</Text>
        <Text style={s.tableHeadCellNum}>{t('dashboard.repHeaderNegotiation')}</Text>
        <Text style={s.tableHeadCellNum}>{t('dashboard.repHeaderWon')}</Text>
        <Text style={s.tableHeadCellNum}>{t('dashboard.repHeaderRevenue')}</Text>
      </View>
      {byRep.map((rep, i) => (
        <View key={rep.user_id} style={[s.tableRow, i === byRep.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1.6 }}>
            <Text style={s.tableName} numberOfLines={1}>
              {rep.name}
            </Text>
            <View style={s.officeTag}>
              <Text style={s.officeTagText}>{rep.office === 'tokyo' ? t('dashboard.officeTokyo') : t('dashboard.officeDubai')}</Text>
            </View>
          </View>
          <Text style={s.tableNum}>{rep.meetings_booked}</Text>
          <Text style={s.tableNumMuted}>—</Text>
          <Text style={s.tableNum}>{rep.won}</Text>
          <Text style={s.tableNumMuted}>—</Text>
        </View>
      ))}
      <Text style={s.cardNote}>{t('dashboard.repNote')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 流入元別 商談予約 — real by_source counts, one colour per source. Honest note: like by_region,
// this counts every lead from that source, not specifically ones that reached meeting-booked.
// ---------------------------------------------------------------------------

function SourceBars({ bySource }: { bySource: SourceBreakdownItem[] }) {
  const [lang] = useLanguage();
  const t = useT();
  const present = bySource.filter((sr) => sr.count > 0);
  if (present.length === 0) {
    return <Text style={s.emptyNote}>{t('dashboard.noSourceData')}</Text>;
  }
  const max = Math.max(1, ...present.map((sr) => sr.count));
  return (
    <View>
      {present.map((sr, i) => (
        <View key={sr.source} style={s.sourceRow}>
          <Text style={s.sourceLabel} numberOfLines={1}>
            {pickBilingual(lang, sr.label, sr.label_ja)}
          </Text>
          <View style={s.sourceTrack}>
            <View
              style={[
                s.sourceFill,
                { width: `${Math.max(4, (sr.count / max) * 100)}%`, backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] },
              ]}
            />
          </View>
          <Text style={s.sourceNum}>{sr.count}</Text>
        </View>
      ))}
      <Text style={s.cardNote}>{t('dashboard.sourceNote')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingVertical: spacing.screen, paddingBottom: 60 },
  capWrap: { width: '100%', maxWidth: MAX_DASHBOARD_WIDTH, alignSelf: 'center' },

  // KPI tiles
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  tileWrap: { padding: spacing.xs / 2, minWidth: 0 },
  tile: { width: '100%', overflow: 'hidden', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, minHeight: 92, ...shadow },
  tileInverted: { backgroundColor: c.charcoal, borderWidth: 0 },
  tileLabel: { color: c.textSecondary, ...type.micro, textTransform: 'none', letterSpacing: 0, fontWeight: '700' },
  tileLabelInverted: { color: c.yellow },
  tileValue: { width: '100%', color: c.textPrimary, fontSize: 25, fontWeight: '800', letterSpacing: -0.5, marginTop: 3, fontVariant: ['tabular-nums'] },
  tileValueInverted: { color: '#FFFFFF' },
  tileValueUnavailable: { width: '100%', color: c.textTertiary, fontSize: 25, fontWeight: '800', marginTop: 3 },
  tileSub: { width: '100%', flexShrink: 1, color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 3, lineHeight: 13 },
  tileSubInverted: { color: c.muted },

  // Card shell
  row: { flexDirection: 'row', gap: spacing.cardGap, marginTop: spacing.cardGap, alignItems: 'stretch' },
  rowStacked: { flexDirection: 'column' },
  flexCard: { flex: 1 },
  card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, ...shadow },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, gap: spacing.sm },
  cardTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '800', flexShrink: 1 },
  cardHint: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0 },
  cardNote: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.hairline, borderStyle: 'dashed', lineHeight: 15 },
  emptyNote: { color: c.textTertiary, ...type.secondary },
  ghostBtn: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: c.card },
  ghostBtnText: { color: c.textPrimary, ...type.pill, fontSize: 11 },

  // Trend chart legend
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 6, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legDot: { width: 9, height: 9, borderRadius: 3 },
  legendText: { color: c.textSecondary, fontSize: 11.5 },
  legendStrong: { color: c.textPrimary, fontWeight: '700' },
  chartFootnote: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 10, lineHeight: 14 },

  // Donut
  donutWrap: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  donutRowLabel: { color: c.textPrimary, fontSize: 12.5, flex: 1 },
  donutRowValue: { color: c.textPrimary, fontWeight: '800', fontSize: 12.5, fontVariant: ['tabular-nums'] },

  // Funnel
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  funnelLabel: { width: 96, fontSize: 12.5, fontWeight: '700', color: c.textPrimary, flexShrink: 0 },
  funnelNum: { width: 66, textAlign: 'right', fontWeight: '800', fontSize: 13, color: c.textPrimary, fontVariant: ['tabular-nums'] },
  funnelPct: { width: 52, textAlign: 'right', fontSize: 11, color: c.textTertiary },

  // Hot leads
  hotRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.hairline },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 34 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  scoreNum: { color: c.textPrimary, fontWeight: '800', fontSize: 13, fontVariant: ['tabular-nums'] },
  hotName: { color: c.textPrimary, fontWeight: '700', fontSize: 13 },
  hotSub: { color: c.textTertiary, fontSize: 11.5, marginTop: 1 },
  reservedChip: { backgroundColor: '#1FA36B1F', borderWidth: 1, borderColor: '#1FA36B40', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  reservedChipText: { color: statusText.success, fontWeight: '700', fontSize: 11 },
  aiChip: { flexDirection: 'row', alignItems: 'center', maxWidth: 150, backgroundColor: palette.violet.soft, borderWidth: 1, borderColor: '#D9CCF2', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  aiChipText: { color: palette.violet.text, fontWeight: '700', fontSize: 11 },

  // Rep table
  tableHeadRow: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.hairline },
  tableHeadCell: { color: c.textTertiary, fontSize: 11, fontWeight: '700' },
  tableHeadCellNum: { flex: 0.8, color: c.textTertiary, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.hairline },
  tableName: { color: c.textPrimary, fontWeight: '700', fontSize: 13 },
  officeTag: { alignSelf: 'flex-start', backgroundColor: c.raised, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 1, marginTop: 3 },
  officeTagText: { color: c.textTertiary, fontSize: 10, fontWeight: '600' },
  tableNum: { flex: 0.8, textAlign: 'right', color: c.textPrimary, fontWeight: '800', fontVariant: ['tabular-nums'] },
  tableNumMuted: { flex: 0.8, textAlign: 'right', color: c.textTertiary, fontWeight: '600' },

  // Source bars
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sourceLabel: { width: 96, fontSize: 12.5, fontWeight: '700', color: c.textPrimary, flexShrink: 0 },
  sourceTrack: { flex: 1, height: 10, backgroundColor: '#EFF0F3', borderRadius: 99, overflow: 'hidden' },
  sourceFill: { height: '100%', borderRadius: 99 },
  sourceNum: { width: 32, textAlign: 'right', fontWeight: '800', fontSize: 12.5, color: c.textPrimary, fontVariant: ['tabular-nums'] },
});
