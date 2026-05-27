/**
 * Shared utility functions for the Project Cues government contracting platform.
 * Centralizes formatting, parsing, and scoring helpers used across pages.
 */

// ── Date Utilities ──────────────────────────────────────────

/**
 * Parse YYYY-MM-DD as LOCAL date (avoids UTC timezone shift that causes off-by-one day).
 * e.g. "2026-06-03" → "Jun 3, 2026" (not Jun 4 due to UTC midnight)
 */
export function formatDeadlineDate(dateStr: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return 'TBD';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return 'TBD';
  return new Date(y, m - 1, d).toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Returns the number of days until a deadline. Negative means overdue.
 */
export function daysUntilDeadline(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const deadline = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
}

/**
 * Returns urgency level based on days remaining.
 */
export function deadlineUrgency(dateStr: string | null): 'critical' | 'warning' | 'normal' | 'expired' | 'unknown' {
  const days = daysUntilDeadline(dateStr);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'normal';
}

// ── Currency Utilities ──────────────────────────────────────

/**
 * Format a numeric amount as USD currency.
 * Returns "Budget TBD" for null/0 values unless showZeroAsTbd is false.
 */
export function formatCurrency(amount: number | string | null | undefined, showZeroAsTbd = true): string {
  if (amount === null || amount === undefined) return 'Budget TBD';
  const val = typeof amount === 'number' ? amount : Number(amount || 0);
  if (isNaN(val) || (showZeroAsTbd && val === 0)) return 'Budget TBD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Format a number in compact notation (e.g. 1.2M, 500K).
 */
export function formatCompactCurrency(amount: number | null): string {
  if (!amount || amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

// ── Scoring Utilities ───────────────────────────────────────

export interface ScoreResult {
  id: string;
  score: number;
  level: 'High' | 'Medium' | 'Low';
  reason: string;
  factors: string[];
}

/**
 * Get Tailwind classes for a score level badge.
 */
export function getScoreColor(level: string): string {
  switch (level) {
    case 'High': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    default: return 'text-red-400 bg-red-500/10 border-red-500/20';
  }
}

// ── Pipeline Stage Definitions ──────────────────────────────

export const PIPELINE_STAGES = [
  { key: 'identified', label: 'Identified', color: 'slate' },
  { key: 'qualifying', label: 'Qualifying', color: 'blue' },
  { key: 'drafting', label: 'Drafting', color: 'amber' },
  { key: 'reviewing', label: 'Reviewing', color: 'purple' },
  { key: 'submitted', label: 'Submitted', color: 'cyan' },
  { key: 'awarded', label: 'Awarded', color: 'emerald' },
  { key: 'lost', label: 'Lost', color: 'red' },
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number]['key'];

// ── Type Definitions ────────────────────────────────────────

export interface ActiveProject {
  id: string;
  title: string;
  agency: string;
  deadline_date: string;
  amount: number;
  url?: string;
  description?: string;
  naics_code?: string;
  classification_code?: string;
  set_aside_type?: string;
  solicitation_number?: string;
  base_type?: string;
  place_of_performance?: string;
  point_of_contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    type?: string;
  };
}

// ── Supabase Retry Helper ───────────────────────────────────

/**
 * Retry a Supabase query with exponential backoff.
 * Retries on network errors, not on application-level Supabase errors.
 */
export async function withRetry<T>(
  fn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  baseDelay = 500
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      // Don't retry on Supabase application errors (auth, RLS, etc.)
      if (result.error && result.error.code && !result.error.message?.includes('fetch')) {
        return result;
      }
      if (!result.error) return result;
      // Network error — retry
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
        continue;
      }
      return result;
    } catch (err: any) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
        continue;
      }
      return { data: null, error: err };
    }
  }
  return { data: null, error: new Error('Max retries exceeded') };
}
