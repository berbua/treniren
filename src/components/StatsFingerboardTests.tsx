'use client';

import { useEffect, useMemo, useState, ReactNode } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { FingerboardTestingProtocol, FingerboardTestResult } from '@/types/workout';
import FingerboardTestChart from './FingerboardTestChart';
import { Select } from './ui';

interface StatsFingerboardTestsProps {
  /** Section card from Statistics (title + body). */
  renderSection: (title: ReactNode, subtitle: ReactNode, body: ReactNode) => ReactNode;
}

/**
 * Fingerboard test results on Statistics: one testing protocol at a time (the most recently tested first).
 * All tests are shown, not only the stats range: tests are weeks apart, so a short range would hold one point.
 * Renders nothing when there are no test results.
 */
export const StatsFingerboardTests = ({ renderSection }: StatsFingerboardTestsProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
  const [protocols, setProtocols] = useState<FingerboardTestingProtocol[]>([]);
  const [results, setResults] = useState<FingerboardTestResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [protocolsRes, resultsRes] = await Promise.all([
          fetch('/api/fingerboard-testing-protocols', { credentials: 'include' }),
          fetch('/api/fingerboard-test-results?protocolId=all', { credentials: 'include' }),
        ]);
        if (protocolsRes.ok) setProtocols(await protocolsRes.json());
        if (resultsRes.ok) setResults(await resultsRes.json());
      } catch (error) {
        console.error('Error loading fingerboard tests for statistics:', error);
      }
    };
    load();
  }, []);

  // Protocols with results, most recently tested first
  const tested = useMemo(() => {
    const lastTest = new Map<string, string>();
    results.forEach(result => {
      const last = lastTest.get(result.protocolId);
      if (!last || result.date > last) lastTest.set(result.protocolId, result.date);
    });
    return protocols
      .filter(protocol => lastTest.has(protocol.id))
      .map(protocol => ({ protocol, lastTest: lastTest.get(protocol.id)! }))
      .sort((a, b) => b.lastTest.localeCompare(a.lastTest));
  }, [protocols, results]);

  if (tested.length === 0) return null;

  const current = tested.find(entry => entry.protocol.id === selectedId) ?? tested[0];
  const protocolResults = results.filter(result => result.protocolId === current.protocol.id);
  const lastDate = new Date(current.lastTest).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  return renderSection(
    t('stats.fingerboardTests') || 'Fingerboard tests',
    t('stats.fingerboardTestsSubtitle', { date: lastDate }) || `All tests · last on ${lastDate}`,
    <div className="space-y-3">
      {tested.length > 1 && (
        <Select
          aria-label={t('stats.testProtocol') || 'Test protocol'}
          value={current.protocol.id}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {tested.map(({ protocol }) => (
            <option key={protocol.id} value={protocol.id}>{protocol.name}</option>
          ))}
        </Select>
      )}
      {tested.length === 1 && <p className="font-bold text-uc-text">{current.protocol.name}</p>}
      <FingerboardTestChart testResults={protocolResults} protocol={current.protocol} plain />
      <Link href={`/fingerboard-testing/${current.protocol.id}`} className="inline-block text-sm font-bold text-uc-primary hover:underline">
        {t('stats.openTestProtocol') || 'Open test protocol →'}
      </Link>
    </div>,
  );
};
