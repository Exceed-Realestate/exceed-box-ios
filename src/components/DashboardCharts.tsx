import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line as SvgLine, Path, Rect, Stop } from 'react-native-svg';
import { c, type } from '../theme';

/** Round a max value up to a "nice" axis top, then split it into 3 equal gridline steps —
 * mirrors the client reference's 0/10/20/30 gridlines, but computed from real data instead of
 * hardcoded, so it still looks right whatever the live numbers are. */
export function niceTicks(maxValue: number): number[] {
  const target = Math.max(1, maxValue);
  const rough = target / 3;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  const norm = rough / pow10;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = niceNorm * pow10 || 1;
  return [0, step, step * 2, step * 3];
}

export interface LineSeries {
  key: string;
  color: string;
  points: number[];
  area?: boolean;
}

const LOGICAL_W = 600;
const Y_COL_WIDTH = 26;

/**
 * Two-series cumulative line chart — react-native-svg, no chart library. The plot's x axis is a
 * fixed logical coordinate space scaled to the container width via viewBox + preserveAspectRatio
 * ("none"); the y-axis label column sits outside the <Svg> at a real fixed pixel width so its text
 * never gets horizontally squashed by that same scaling.
 */
export function LineChart({
  series,
  xLabels,
  height = 190,
}: {
  series: LineSeries[];
  xLabels: string[];
  height?: number;
}) {
  const padTop = 8;
  const padBottom = 20;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(1, ...series.flatMap((sr) => sr.points));
  const ticks = niceTicks(maxVal);
  const topTick = ticks[ticks.length - 1];

  const n = Math.max(1, xLabels.length - 1);
  const xAt = (i: number) => (n === 0 ? 0 : (i / n) * LOGICAL_W);
  const yAt = (v: number) => padTop + plotH - (Math.min(v, topTick) / topTick) * plotH;

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: Y_COL_WIDTH, height }}>
          {ticks.map((t) => (
            <Text key={t} style={[s.yLabel, { position: 'absolute', right: 6, top: yAt(t) - 6 }]}>
              {Math.round(t)}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <Svg width="100%" height={height} viewBox={`0 0 ${LOGICAL_W} ${height}`} preserveAspectRatio="none">
            <Defs>
              {series
                .filter((sr) => sr.area)
                .map((sr) => (
                  <LinearGradient key={`grad-${sr.key}`} id={`area-${sr.key}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={sr.color} stopOpacity={0.32} />
                    <Stop offset="1" stopColor={sr.color} stopOpacity={0.02} />
                  </LinearGradient>
                ))}
            </Defs>

            {ticks.map((t) => (
              <SvgLine key={t} x1={0} x2={LOGICAL_W} y1={yAt(t)} y2={yAt(t)} stroke={c.hairline} strokeWidth={1} />
            ))}

            {series.map((sr) => {
              if (!sr.area || sr.points.length === 0) return null;
              const top = sr.points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`).join(' ');
              const d = `${top} L ${xAt(sr.points.length - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`;
              return <Path key={`area-${sr.key}`} d={d} fill={`url(#area-${sr.key})`} stroke="none" />;
            })}

            {series.map((sr) => {
              if (sr.points.length === 0) return null;
              const d = sr.points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`).join(' ');
              return (
                <React.Fragment key={`line-${sr.key}`}>
                  <Path d={d} fill="none" stroke={sr.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  {sr.points.map((v, i) => (
                    <Circle key={i} cx={xAt(i)} cy={yAt(v)} r={3.5} fill="#FFFFFF" stroke={sr.color} strokeWidth={2.5} />
                  ))}
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      </View>

      <View style={[s.xRow, { paddingLeft: Y_COL_WIDTH }]}>
        {xLabels.map((l, i) => (
          <Text key={i} style={s.xLabel} numberOfLines={1}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Horizontal gradient bar (yellow -> gold) on a light track, used by the funnel card. */
export function GradientBar({ widthPct, height = 22 }: { widthPct: number; height?: number }) {
  const w = Math.max(0, Math.min(100, widthPct));
  return (
    <View style={[s.track, { height, borderRadius: height / 2 }]}>
      <Svg width={`${w}%`} height={height}>
        <Defs>
          <LinearGradient id="funnelGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFD84D" />
            <Stop offset="1" stopColor="#F0B429" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height={height} rx={height / 2} fill="url(#funnelGrad)" />
      </Svg>
    </View>
  );
}

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Ring-style donut built from stacked <Circle strokeDasharray> segments — the standard SVG donut
 * trick, avoids hand-rolling arc <Path> math. */
export function DonutChart({
  segments,
  size = 130,
  strokeWidth = 20,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerValue: string;
  centerLabel: string;
}) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  let cumulative = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {total <= 0 ? (
          <Circle cx={cx} cy={cy} r={r} stroke={c.hairline} strokeWidth={strokeWidth} fill="none" />
        ) : (
          segments.map((seg) => {
            if (seg.value <= 0) return null;
            const frac = seg.value / total;
            const dash = frac * circumference;
            const gap = circumference - dash;
            const offset = circumference * 0.25 - cumulative * circumference; // start at 12 o'clock
            cumulative += frac;
            return (
              <Circle
                key={seg.key}
                cx={cx}
                cy={cy}
                r={r}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })
        )}
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={s.donutCenter}>
          <Text style={s.donutValue} numberOfLines={1} adjustsFontSizeToFit>
            {centerValue}
          </Text>
          <Text style={s.donutLabel} numberOfLines={1}>
            {centerLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  yLabel: { fontSize: 9, color: c.textTertiary, fontVariant: ['tabular-nums'] },
  xRow: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 4, marginTop: 4 },
  xLabel: { fontSize: 10, color: c.textTertiary, fontVariant: ['tabular-nums'] },
  track: { flex: 1, backgroundColor: '#EFF0F3', overflow: 'hidden' },
  donutCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  donutValue: { color: c.textPrimary, fontSize: 19, fontWeight: '800', fontVariant: ['tabular-nums'] },
  donutLabel: { color: c.textTertiary, ...type.micro, marginTop: 1 },
});
