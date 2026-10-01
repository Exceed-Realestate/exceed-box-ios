import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number;
}

/** Small hand-rolled line icons (react-native-svg, already a direct dependency) — kept in the
 * same custom-SVG style as LoginScreen's GoogleG/EyeIcon rather than pulling in an icon library. */

export function TodayIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="15" rx="2.5" stroke={color} strokeWidth={1.8} />
      <Path d="M8 3v4M16 3v4M4 10h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.5 14.2l2 2 4-4.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LeadsIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth={1.8} />
      <Path d="M3.5 20c0-3.3 2.6-5.6 5.5-5.6s5.5 2.3 5.5 5.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="17.5" cy="7.5" r="2.2" stroke={color} strokeWidth={1.6} />
      <Path d="M15.6 14.6c2.5.2 4.4 2.2 4.4 5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function PipelineIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="4" width="5" height="16" rx="1.4" stroke={color} strokeWidth={1.7} />
      <Rect x="9.7" y="8" width="5" height="12" rx="1.4" stroke={color} strokeWidth={1.7} />
      <Rect x="15.9" y="11.5" width="5" height="8.5" rx="1.4" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function DashboardIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20V11" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M10 20V6" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M16 20V13" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M20 20V9" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export function TeamIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7.5" cy="8" r="2.7" stroke={color} strokeWidth={1.7} />
      <Circle cx="16.5" cy="8" r="2.7" stroke={color} strokeWidth={1.7} />
      <Path d="M2.7 19.5c0-3 2.2-5.2 4.8-5.2s4.8 2.2 4.8 5.2" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M11.7 19.5c0-3 2.2-5.2 4.8-5.2s4.8 2.2 4.8 5.2" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function AdminIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3.1" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5M17.8 17.8l-1.5-1.5M7.7 7.7L6.2 6.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TrackingIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3.5 17.5l5-6 4 3.2 7.5-8.7" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.5 5h4.5v4.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NurtureIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5.5" width="17" height="13" rx="2.2" stroke={color} strokeWidth={1.8} />
      <Path d="M4.2 6.6l7.3 5.6a1 1 0 001.2 0l7.1-5.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SnsIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="12" r="2.4" stroke={color} strokeWidth={1.8} />
      <Circle cx="18" cy="6" r="2.4" stroke={color} strokeWidth={1.8} />
      <Circle cx="18" cy="18" r="2.4" stroke={color} strokeWidth={1.8} />
      <Path d="M8.1 10.8l7.8-3.6M8.1 13.2l7.8 3.6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function BookingIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="15" rx="2.5" stroke={color} strokeWidth={1.8} />
      <Path d="M8 3v4M16 3v4M4 10h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="12" cy="15" r="2.2" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function AssignIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="7.5" r="2.6" stroke={color} strokeWidth={1.7} />
      <Path d="M3 19c0-2.9 1.8-5 4-5s4 2.1 4 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M13.5 9h6.5M16.7 6l3.3 3-3.3 3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IntegrationsIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="12" r="2.8" stroke={color} strokeWidth={1.8} />
      <Circle cx="18" cy="12" r="2.8" stroke={color} strokeWidth={1.8} />
      <Path d="M8.8 12h6.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="2.4 2.4" />
    </Svg>
  );
}

export function SettingsIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5.5v3M12 15.5v3M18.5 12h-3M8.5 12h-3M16.6 7.4l-2.1 2.1M9.5 14.5l-2.1 2.1M16.6 16.6l-2.1-2.1M9.5 9.5L7.4 7.4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx="12" cy="12" r="2.6" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function MoreIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="12" r="1.7" fill={color} />
      <Circle cx="12" cy="12" r="1.7" fill={color} />
      <Circle cx="19" cy="12" r="1.7" fill={color} />
    </Svg>
  );
}
