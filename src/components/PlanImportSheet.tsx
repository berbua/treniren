'use client';

import { useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApiError } from '@/hooks/useApiError';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { extractApiError } from '@/lib/errors';
import { PLAN_PROMPT_FOR_CLAUDE, PlanRowError, parsePlanCsv } from '@/lib/plan-import';
import { BottomSheet, Button, Icon, Label, Textarea, WorkoutIcon, workoutBg } from './ui';

interface PlanImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the number of sessions saved. */
  onImported: (count: number) => void;
}

/** Import a training plan: paste CSV (e.g. from Claude) or pick a .csv file, check the preview, save. */
export const PlanImportSheet = ({ isOpen, onClose, onImported }: PlanImportSheetProps) => {
  const { t, tPlural, language } = useLanguage();
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
  const { handleError } = useApiError();
  const { getToken } = useCsrfToken();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const parsed = useMemo(() => (text.trim() ? parsePlanCsv(text) : null), [text]);
  const sessions = parsed?.sessions ?? [];

  const close = () => {
    setText('');
    setCopied(false);
    onClose();
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PLAN_PROMPT_FOR_CLAUDE);
      setCopied(true);
    } catch {
      handleError(new Error('Clipboard unavailable'), t('plans.copyFailed') || 'Could not copy — select the text below instead');
    }
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setText(await file.text());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async () => {
    if (sessions.length === 0) return;
    setIsSaving(true);
    try {
      const csrfToken = await getToken();
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ plans: sessions }),
      });
      if (!response.ok) throw await extractApiError(response);
      const { count } = await response.json();
      setText('');
      setCopied(false);
      onImported(count);
    } catch (error) {
      handleError(error, 'Failed to import plan');
    } finally {
      setIsSaving(false);
    }
  };

  const errorText = (error: PlanRowError) => {
    const reason = t(`plans.errors.${error.reason}`);
    return error.row > 0 ? t('plans.errors.row', { row: error.row, reason }) : reason;
  };
  const formatDate = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={close}
      title={t('plans.importTitle') || 'Import training plan'}
      closeLabel={t('common.close') || 'Close'}
      footer={
        <Button variant="accent" size="lg" className="w-full" onClick={save} disabled={sessions.length === 0} isLoading={isSaving}>
          <Icon name="download" />
          {sessions.length > 0
            ? tPlural('plans.importCount', sessions.length)
            : t('plans.import') || 'Import'}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* 1. Ask Claude */}
        <div className="space-y-2">
          <p className="text-sm text-uc-text">
            {t('plans.step1') || 'Ask Claude for your plan and add these instructions, so it answers in the format the app reads:'}
          </p>
          <Button variant="tonal" onClick={copyPrompt}>
            <Icon name={copied ? 'success' : 'duplicate'} />
            {copied ? t('plans.copied') || 'Copied' : t('plans.copyPrompt') || 'Copy instructions for Claude'}
          </Button>
          <details className="text-[13px] text-uc-text-muted">
            <summary className="min-h-11 cursor-pointer content-center font-bold">{t('plans.showFormat') || 'Show the format'}</summary>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-xl bg-uc-elevated p-3 text-xs text-uc-text">
              {PLAN_PROMPT_FOR_CLAUDE}
            </pre>
          </details>
        </div>

        {/* 2. Paste or pick a file */}
        <div>
          <Label htmlFor="plan-import-text">{t('plans.step2') || 'Paste the CSV Claude gave you'}</Label>
          <Textarea
            id="plan-import-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'date,type,title,volume,notes\n2026-11-16,FINGERBOARD,Max hangs 20mm,TR4,5x10s +12kg'}
            rows={6}
            spellCheck={false}
            className="font-mono text-xs"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
              <Icon name="note" />
              {t('plans.chooseFile') || 'Or choose a .csv file'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => readFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {/* 3. Preview */}
        {parsed && (
          <div className="space-y-2">
            {parsed.errors.length > 0 && (
              <div className="space-y-1 rounded-xl bg-uc-warning-bg p-3 text-[13px] text-uc-text">
                {parsed.errors.map((error, i) => (
                  <p key={i} className="flex gap-2">
                    <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-uc-warning" />
                    {errorText(error)}
                  </p>
                ))}
                {sessions.length > 0 && (
                  <p className="pl-6 text-uc-text-muted">{t('plans.errorsSkipped') || 'Rows with problems are skipped.'}</p>
                )}
              </div>
            )}
            {sessions.length > 0 && (
              <ul className="divide-y divide-uc-border rounded-xl border border-uc-border">
                {sessions.map((session, i) => (
                  <li key={i} className="flex items-start gap-3 px-3 py-2.5">
                    <span aria-hidden className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-uc-chip-ink ${workoutBg[session.type]}`}>
                      <WorkoutIcon workoutType={session.type} size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-uc-text">
                        <span className="uc-num">{formatDate(session.date)}</span>
                        {' · '}
                        {session.title || t(`workouts.workoutTypes.${session.type}`)}
                        {session.trainingVolume && <span className="font-semibold text-uc-text-muted"> · {session.trainingVolume}</span>}
                      </p>
                      {session.notes && <p className="line-clamp-2 text-[13px] text-uc-text-muted">{session.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
