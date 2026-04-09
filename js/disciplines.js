// ISSF discipline configurations. All timing in seconds; offsetMs in buildEventSequence.
export const DISCIPLINES = {
  standard_pistol: {
    id: 'standard_pistol',
    modes: {
      '150s': {
        id: '150s',
        durationSeconds: 150,
        shots: 5,
        seriesPerMatch: 4,
        signalType: 'slow',
        attentionDelay: 5,
        shotTargetSeconds: [30, 60, 90, 120, 145],
        hasLoop: false,
        hasDuel: false,
      },
      '20s': {
        id: '20s',
        durationSeconds: 20,
        shots: 5,
        seriesPerMatch: 4,
        signalType: 'rapid',
        attentionDelay: 3,
        shotTargetSeconds: [2, 6, 10, 14, 17],
        hasLoop: true,
        hasDuel: false,
      },
      '10s': {
        id: '10s',
        durationSeconds: 10,
        shots: 5,
        seriesPerMatch: 4,
        signalType: 'rapid',
        attentionDelay: 3,
        shotTargetSeconds: [3, 4.5, 6, 7.5, 9],
        hasLoop: true,
        hasDuel: false,
      },
      real_match: {
        id: 'real_match',
        isRealMatch: true,
        competitionAttentionDelay: 7,
        // First stage has sighting series before it
        stages: [
          { modeId: '150s', count: 4, hasSighting: true },
          { modeId: '20s',  count: 4 },
          { modeId: '10s',  count: 4 },
        ],
        restBetweenSeries: 60,   // loading time between series
        restBetweenStages: 180,  // ~3 min break between blocks
      },
    },
  },

  pistol_25m: {
    id: 'pistol_25m',
    modes: {
      '300s': {
        id: '300s',
        durationSeconds: 300,
        shots: 5,
        seriesPerMatch: 6,
        signalType: 'slow',
        attentionDelay: 5,
        shotTargetSeconds: [60, 120, 180, 240, 290],
        hasLoop: false,
        hasDuel: false,
      },
      duel: {
        id: 'duel',
        shots: 5,
        seriesPerMatch: 6,
        signalType: 'rapid',
        attentionDelay: 3,
        duelAwaySeconds: 7,
        duelFaceSeconds: 3,
        hasLoop: true,
        hasDuel: true,
      },
      real_match: {
        id: 'real_match',
        isRealMatch: true,
        competitionAttentionDelay: 7,
        // Each stage has its own sighting series
        stages: [
          { modeId: '300s', count: 6, hasSighting: true },
          { modeId: 'duel', count: 6, hasSighting: true },
        ],
        restBetweenSeries: 60,   // loading time between series
        restBetweenStages: 180,  // ~3 min break between stages
      },
    },
  },

  rapid_fire: {
    id: 'rapid_fire',
    modes: {
      '8s': {
        id: '8s',
        durationSeconds: 8,
        shots: 5,
        seriesPerMatch: 4,
        signalType: 'rapid',
        attentionDelay: 3,
        shotTargetSeconds: [3, 4.2, 5.4, 6.6, 7.8],
        hasLoop: true,
        hasDuel: false,
      },
      '6s': {
        id: '6s',
        durationSeconds: 6,
        shots: 5,
        seriesPerMatch: 4,
        signalType: 'rapid',
        attentionDelay: 3,
        shotTargetSeconds: [2.5, 3.4, 4.3, 5.2, 6],
        hasLoop: true,
        hasDuel: false,
      },
      '4s': {
        id: '4s',
        durationSeconds: 4,
        shots: 5,
        seriesPerMatch: 4,
        signalType: 'rapid',
        attentionDelay: 3,
        shotTargetSeconds: [2, 2.5, 3, 3.5, 4],
        hasLoop: true,
        hasDuel: false,
      },
      real_match: {
        id: 'real_match',
        isRealMatch: true,
        competitionAttentionDelay: 7,
        sightingSeries: { modeId: '8s' },  // 1 trial series before first half
        halves: 2,
        halfPattern: [
          { modeId: '8s', count: 2 },
          { modeId: '6s', count: 2 },
          { modeId: '4s', count: 2 },
        ],
        restBetweenSeries: 60,   // loading time between every series within a half
        restBetweenHalves: 300,  // 5 min break between halves
      },
    },
  },
};

export function getDiscipline(id) { return DISCIPLINES[id] ?? null; }
export function getMode(disciplineId, modeId) { return DISCIPLINES[disciplineId]?.modes[modeId] ?? null; }

// Builds a flat array of {offsetMs, type, payload} events for TimerEngine.
// type values: 'attention' | 'shoot' | 'start' | 'shot_target' | 'series_end' |
//              'rest_start' | 'rest_end' | 'away' | 'face' |
//              'stage_break_start' | 'stage_break_end' |
//              'half_break_start' | 'half_break_end' | 'match_end'
export function buildEventSequence(disciplineId, modeId) {
  const discipline = getDiscipline(disciplineId);
  const mode = getMode(disciplineId, modeId);
  if (!discipline || !mode) return [];

  if (mode.isRealMatch) return _buildRealMatchSequence(disciplineId, mode);
  return _buildSingleModeSequence(discipline, mode, 0);
}

// opts: { isSighting?: bool, attentionDelay?: number }
function _buildSingleModeSequence(discipline, mode, startOffsetMs, opts = {}) {
  const { isSighting = false, attentionDelay: attnOverride } = opts;
  const attentionDelay = attnOverride ?? mode.attentionDelay;
  const events = [];
  let t = startOffsetMs;

  if (mode.hasDuel) {
    // Duel: attention → (7s away + 3s face) × 5 → series_end
    events.push({ offsetMs: t, type: 'attention', payload: { modeId: mode.id, isSighting } });
    t += attentionDelay * 1000;
    for (let i = 0; i < mode.shots; i++) {
      events.push({ offsetMs: t, type: 'away', payload: { shotIndex: i, modeId: mode.id } });
      t += mode.duelAwaySeconds * 1000;
      events.push({ offsetMs: t, type: 'face', payload: { shotIndex: i, modeId: mode.id } });
      // Recommended shot indicator at ~2.7s into face window (ISSF timing guideline)
      events.push({ offsetMs: t + 2700, type: 'shot_target', payload: { shotIndex: i } });
      t += mode.duelFaceSeconds * 1000;
    }
    events.push({ offsetMs: t, type: 'series_end', payload: { isSighting } });
  } else {
    // Standard timed mode: attention → start/shoot → shot_targets × N → series_end
    const signalKey = mode.signalType === 'slow' ? 'start' : 'shoot';
    events.push({ offsetMs: t, type: 'attention', payload: { modeId: mode.id, isSighting } });
    t += attentionDelay * 1000;
    events.push({ offsetMs: t, type: signalKey, payload: { modeId: mode.id } });
    const greenLightMs = t;
    for (let i = 0; i < mode.shotTargetSeconds.length; i++) {
      events.push({
        offsetMs: greenLightMs + mode.shotTargetSeconds[i] * 1000,
        type: 'shot_target',
        payload: { shotIndex: i },
      });
    }
    t = greenLightMs + mode.durationSeconds * 1000;
    events.push({ offsetMs: t, type: 'series_end', payload: { isSighting } });
  }

  return events;
}

function _buildRealMatchSequence(disciplineId, matchMode) {
  // Rapid fire uses half-pattern structure with half breaks
  if (matchMode.halfPattern) {
    return _buildHalfPatternRealMatch(disciplineId, matchMode);
  }

  const discipline = getDiscipline(disciplineId);
  const events = [];
  let cursor = 0;
  const rest = matchMode.restBetweenSeries * 1000;
  const stageBreak = matchMode.restBetweenStages * 1000;
  const attnOverride = matchMode.competitionAttentionDelay;

  const stages = matchMode.stages;
  const stageCount = stages.length;

  for (let si = 0; si < stageCount; si++) {
    const stage = stages[si];
    const mode = getMode(disciplineId, stage.modeId);

    // Optional sighting series before this stage
    if (stage.hasSighting) {
      const sightEvents = _buildSingleModeSequence(discipline, mode, cursor, {
        isSighting: true,
        attentionDelay: attnOverride,
      });
      events.push(...sightEvents);
      cursor = sightEvents[sightEvents.length - 1].offsetMs;
      // Loading rest after sighting
      events.push({ offsetMs: cursor, type: 'rest_start', payload: { durationMs: rest, isLoading: true } });
      cursor += rest;
      events.push({ offsetMs: cursor, type: 'rest_end', payload: {} });
    }

    for (let seriesIdx = 0; seriesIdx < stage.count; seriesIdx++) {
      const seriesEvents = _buildSingleModeSequence(discipline, mode, cursor, {
        attentionDelay: attnOverride,
      });
      events.push(...seriesEvents);
      cursor = seriesEvents[seriesEvents.length - 1].offsetMs;

      const isLastSeriesInStage = seriesIdx === stage.count - 1;
      const isLastStage = si === stageCount - 1;

      if (!isLastSeriesInStage || !isLastStage) {
        if (isLastSeriesInStage && !isLastStage) {
          // Stage break between blocks
          events.push({ offsetMs: cursor, type: 'stage_break_start', payload: { durationMs: stageBreak } });
          cursor += stageBreak;
          events.push({ offsetMs: cursor, type: 'stage_break_end', payload: {} });
        } else {
          // Loading rest between series
          events.push({ offsetMs: cursor, type: 'rest_start', payload: { durationMs: rest, isLoading: true } });
          cursor += rest;
          events.push({ offsetMs: cursor, type: 'rest_end', payload: {} });
        }
      }
    }
  }

  events.push({ offsetMs: cursor, type: 'match_end', payload: {} });
  return events;
}

// Rapid fire: sighting series → half 1 (all series with loading breaks) → half break → half 2
function _buildHalfPatternRealMatch(disciplineId, matchMode) {
  const discipline = getDiscipline(disciplineId);
  const events = [];
  let cursor = 0;
  const rest = matchMode.restBetweenSeries * 1000;
  const halfBreak = matchMode.restBetweenHalves * 1000;
  const attnOverride = matchMode.competitionAttentionDelay;

  // Sighting series before first half
  if (matchMode.sightingSeries) {
    const sightMode = getMode(disciplineId, matchMode.sightingSeries.modeId);
    const sightEvents = _buildSingleModeSequence(discipline, sightMode, cursor, {
      isSighting: true,
      attentionDelay: attnOverride,
    });
    events.push(...sightEvents);
    cursor = sightEvents[sightEvents.length - 1].offsetMs;
    events.push({ offsetMs: cursor, type: 'rest_start', payload: { durationMs: rest, isLoading: true } });
    cursor += rest;
    events.push({ offsetMs: cursor, type: 'rest_end', payload: {} });
  }

  const pattern = matchMode.halfPattern;

  for (let h = 0; h < matchMode.halves; h++) {
    const isLastHalf = h === matchMode.halves - 1;

    for (let pi = 0; pi < pattern.length; pi++) {
      const { modeId, count } = pattern[pi];
      const mode = getMode(disciplineId, modeId);
      const isLastGroup = pi === pattern.length - 1;

      for (let si = 0; si < count; si++) {
        const seriesEvents = _buildSingleModeSequence(discipline, mode, cursor, {
          attentionDelay: attnOverride,
        });
        events.push(...seriesEvents);
        cursor = seriesEvents[seriesEvents.length - 1].offsetMs;

        const isLastInGroup = si === count - 1;
        const isMatchEnd = isLastHalf && isLastGroup && isLastInGroup;

        if (!isMatchEnd) {
          if (isLastInGroup && isLastGroup && !isLastHalf) {
            // Half break between the two halves
            events.push({ offsetMs: cursor, type: 'half_break_start', payload: { durationMs: halfBreak } });
            cursor += halfBreak;
            events.push({ offsetMs: cursor, type: 'half_break_end', payload: {} });
          } else {
            // Loading rest between series (within half, including between mode groups)
            events.push({ offsetMs: cursor, type: 'rest_start', payload: { durationMs: rest, isLoading: true } });
            cursor += rest;
            events.push({ offsetMs: cursor, type: 'rest_end', payload: {} });
          }
        }
      }
    }
  }

  events.push({ offsetMs: cursor, type: 'match_end', payload: {} });
  return events;
}
