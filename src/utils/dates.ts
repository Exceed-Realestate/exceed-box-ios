import { type Lang, t as translateCurrent, translate } from '../i18n';

export function formatDue(iso: string, lang?: Lang): { text: string; overdue: boolean } {
  const due = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const diffH = diffMs / (1000 * 60 * 60);
  const overdue = diffMs < 0;
  const abs = Math.abs(diffH);
  const tr = lang ? (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(lang, key, vars) : translateCurrent;

  if (abs < 1) {
    const mins = Math.round(abs * 60);
    return { text: tr(overdue ? 'dates.overdueByMinutes' : 'dates.dueInMinutes', { n: mins }), overdue };
  }
  if (abs < 24) {
    const h = Math.round(abs);
    return { text: tr(overdue ? 'dates.overdueByHours' : 'dates.dueInHours', { n: h }), overdue };
  }
  const d = Math.round(abs / 24);
  return { text: tr(overdue ? 'dates.overdueByDays' : 'dates.dueInDays', { n: d }), overdue };
}

function intlLocale(lang?: Lang): string {
  return lang === 'en' ? 'en-GB' : lang === 'ja' ? 'ja-JP' : 'ja-JP';
}

export function formatDateTime(iso: string, lang?: Lang): string {
  const d = new Date(iso);
  return d.toLocaleString(intlLocale(lang), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string, lang?: Lang): string {
  const d = new Date(iso);
  return d.toLocaleDateString(intlLocale(lang), { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relativeFromNow(iso: string, lang?: Lang): string {
  const then = new Date(iso).getTime();
  const diffH = (Date.now() - then) / (1000 * 60 * 60);
  const tr = lang ? (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(lang, key, vars) : translateCurrent;
  if (diffH < 1) return tr('dates.relativeMinutes', { n: Math.max(1, Math.round(diffH * 60)) });
  if (diffH < 24) return tr('dates.relativeHours', { n: Math.round(diffH) });
  return tr('dates.relativeDays', { n: Math.round(diffH / 24) });
}
