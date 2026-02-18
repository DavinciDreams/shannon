/**
 * DifficultyEstimator — Heuristic bug scoring and model routing
 *
 * Inspired by the reading-time tutorial pattern:
 *   reading-time:  count words → wordCount / 200 → "5 min read" badge
 *   Shannon:       count signals → score signals → "medium difficulty" → route to nano/cloud-fast/cloud-deep
 *
 * Phase 1: Pure heuristic scoring (no LLM call, instant).
 * Phase 2 (analysis-orchestrator): Optional Nano-refined estimation.
 */

class DifficultyEstimator {
  /**
   * Score bug complexity from observable signals.
   * No LLM call — pure heuristic computation.
   *
   * @param {object[]} consoleLogs - Captured console logs
   * @param {object|null} elementData - Selected element info
   * @param {object|null} changePattern - Frame differ output (if dynamic observation is active)
   * @returns {{ level: string, score: number, estimate: string, model: string, modelReason: string, signals: string[] }}
   */
  estimateFromSignals(consoleLogs = [], elementData = null, changePattern = null) {
    let score = 0;
    const signals = [];

    // --- Console signal scoring ---
    const errors = consoleLogs.filter(l => l.level === 'error');
    const warnings = consoleLogs.filter(l => l.level === 'warn');
    const uniqueFiles = new Set(
      errors.map(e => e.source?.file).filter(Boolean)
    );

    // Error volume
    score += Math.min(errors.length * 2, 20);
    if (errors.length > 0) signals.push(`${errors.length} error(s)`);

    // Multi-file errors (cross-cutting issue)
    if (uniqueFiles.size > 1) {
      score += uniqueFiles.size * 5;
      signals.push(`errors span ${uniqueFiles.size} files`);
    }

    // Stack trace depth (deeper = more complex call chain)
    errors.forEach(e => {
      if (e.stackTrace) {
        const depth = e.stackTrace.split('\n').length;
        if (depth > 5) {
          score += 3;
          signals.push('deep stack trace');
        }
      }
    });

    // Error category scoring
    const categorySignals = new Set();
    errors.forEach(e => {
      const msg = (e.message || '').toLowerCase();
      if ((msg.includes('cors') || msg.includes('cross-origin')) && !categorySignals.has('CORS')) {
        score += 4;
        categorySignals.add('CORS');
        signals.push('CORS issue');
      }
      if ((msg.includes('memory') || msg.includes('heap')) && !categorySignals.has('memory')) {
        score += 5;
        categorySignals.add('memory');
        signals.push('memory issue');
      }
      if ((msg.includes('network') || msg.includes('fetch') || msg.includes('xhr')) && !categorySignals.has('network')) {
        score += 3;
        categorySignals.add('network');
        signals.push('network error');
      }
      if ((msg.includes('undefined') || msg.includes('null')) && !categorySignals.has('nullref')) {
        score += 1;
        categorySignals.add('nullref');
        signals.push('null/undefined');
      }
      if (msg.includes('timeout') && !categorySignals.has('timeout')) {
        score += 3;
        categorySignals.add('timeout');
        signals.push('timeout');
      }
      if ((msg.includes('security') || msg.includes('csp')) && !categorySignals.has('security')) {
        score += 4;
        categorySignals.add('security');
        signals.push('security/CSP');
      }
    });

    // Warning volume (lower weight)
    score += Math.min(warnings.length, 5);
    if (warnings.length > 0) signals.push(`${warnings.length} warning(s)`);

    // --- Visual signal scoring (from frame differ, Phase 3) ---
    if (changePattern) {
      if (changePattern.flicker) {
        score += 6;
        signals.push(`UI flicker (${changePattern.flickerCount} oscillations)`);
      }
      if (changePattern.frozen) {
        score += 4;
        signals.push('UI frozen');
      }
      if (changePattern.layoutShifts && changePattern.layoutShifts.length > 0) {
        score += changePattern.layoutShifts.length * 3;
        signals.push(`${changePattern.layoutShifts.length} layout shift(s)`);
      }
    }

    // --- Map score to difficulty band + recommended model ---
    return this._scoreToDifficulty(score, signals);
  }

  /**
   * Map a numeric score to a difficulty level and model recommendation.
   * @private
   */
  _scoreToDifficulty(score, signals) {
    if (score <= 3) return {
      level: 'trivial',
      score,
      estimate: '< 30 min',
      model: 'nano',
      modelReason: 'Simple issue, on-device analysis sufficient',
      signals,
      color: '#16a34a' // green
    };
    if (score <= 10) return {
      level: 'easy',
      score,
      estimate: '30 min - 2 hours',
      model: 'nano',
      modelReason: 'Straightforward bug, Nano can diagnose',
      signals,
      color: '#2563eb' // blue
    };
    if (score <= 20) return {
      level: 'medium',
      score,
      estimate: '2-6 hours',
      model: 'cloud-fast',
      modelReason: 'Multi-factor issue, use fast cloud model (haiku/gpt-4o-mini)',
      signals,
      color: '#f59e0b' // amber
    };
    if (score <= 35) return {
      level: 'hard',
      score,
      estimate: '6-16 hours',
      model: 'cloud-deep',
      modelReason: 'Complex issue spanning multiple files/systems, use full cloud model',
      signals,
      color: '#ea580c' // orange
    };
    return {
      level: 'complex',
      score,
      estimate: '2-5 days',
      model: 'cloud-deep',
      modelReason: 'Architectural issue, needs deep analysis with large context model',
      signals,
      color: '#dc2626' // red
    };
  }
}

export default DifficultyEstimator;
