'use client'

import { FingerboardTestResult } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatHangDescription } from '@/lib/fingerboard-utils'

/** Test results as a scrollable table: date, hang, load, time, result chip, notes. */
export default function FingerboardTestResultsTable({ testResults }: { testResults: FingerboardTestResult[] }) {
  const { t, language } = useLanguage()
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'

  const th = 'px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-uc-text-muted whitespace-nowrap'
  const td = 'px-3 py-3 text-sm text-uc-text whitespace-nowrap uc-num'

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-uc-border">
          <tr>
            <th className={th}>{t('fingerboardTesting.columns.date')}</th>
            <th className={th}>{t('fingerboardTesting.columns.hangType')}</th>
            <th className={th}>{t('fingerboardTesting.columns.load')}</th>
            <th className={th}>{t('fingerboardTesting.columns.time')}</th>
            <th className={th}>{t('fingerboardTesting.columns.success')}</th>
            <th className={th}>{t('fingerboardTesting.columns.notes')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-uc-border">
          {testResults.map((result) => (
            <tr key={result.id}>
              <td className={`${td} font-bold`}>
                {new Date(result.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className={td}>
                {formatHangDescription(
                  t,
                  result.handType,
                  result.gripType,
                  result.crimpSize,
                  result.customDescription
                ).replace(/ • /g, ' · ')}
              </td>
              <td className={td}>
                {result.load !== null && result.load !== undefined
                  ? `+${result.load} kg`
                  : result.unload !== null && result.unload !== undefined
                  ? `−${result.unload} kg`
                  : '–'}
              </td>
              <td className={td}>{result.timeSeconds ? `${result.timeSeconds} s` : '–'}</td>
              <td className={td}>
                {result.success === true ? (
                  <span className="inline-flex min-h-6 items-center rounded-uc-chip bg-uc-success-bg px-2 text-xs font-bold text-uc-success">
                    {t('fingerboardTesting.yes') || 'Yes'}
                  </span>
                ) : result.success === false ? (
                  <span className="inline-flex min-h-6 items-center rounded-uc-chip bg-uc-error-bg px-2 text-xs font-bold text-uc-error">
                    {t('fingerboardTesting.no') || 'No'}
                  </span>
                ) : (
                  <span className="text-uc-text-muted">–</span>
                )}
              </td>
              <td className="min-w-40 px-3 py-3 text-sm text-uc-text-muted">{result.notes || '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
