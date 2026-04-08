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
        stages: [
          { modeId: '150s', count: 4 },
          { modeId: '20s', count: 4 },
          { modeId: '10s', count: 4 },
        ],
        restBetweenSeries: 12,
        restBetweenStages: 30,
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
        stages: [
          { modeId: '300s', count: 6 },
          { modeId: 'duel', count: 6 },
        ],
        restBetweenSeries: 12,
        restBetweenStages: 30,
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
        halves: 2,
        halfPattern: [
          { modeId: '8s', count: 2 },
          { modeId: '6s', count: 2 },
          { modeId: '4s', count: 2 },
        ],
        restBetweenSeries: 12,
        restBetweenStages: 30,
      },
    },
  },
};

export function getDiscipline(id) { return DISCIPLINES[id] ?? null; }
export function getMode(disciplineId, modeId) { return DISCIPLINES[disciplineId]?.modes[modeId] ?? null; }

// Builds a flat array of {offsetMs, type, payload} events for TimerEngine.
// type values: 'attention' | 'shoot' | 'start' | 'shot_target' | 'series_end' |
//              'rest_start' | 'rest_end' | 'away' | 'face' |
//              'stage_break_start' | 'stage_break_end' | 'match_end'
export function buildEventSequence(disciplineId, modeId) {
  const discipline = getDiscipline(disciplineId);
  const mode = getMode(disciplineId, modeId);
  if (!discipline || !mode) return [];

  if (mode.isRealMatch) return _buildRealMatchSequence(disciplineId, mode);
  return _buildSingleModeSequence(discipline, mode, 0);
}

function _buildSingleModeSequence(discipline, mode, startOffsetMs) {
  const events = [];
  let t = startOffsetMs;

  if (mode.hasDuel) {
    // Duel: attention → (7s away + 3s face) × 5 → series_end
    events.push({ offsetMs: t, type: 'attention', payload: {} });
    t += mode.attentionDelay * 1000;
    for (let i = 0; i < mode.shots; i++) {
      events.push({ offsetMs: t, type: 'away', payload: { shotIndex: i } });
      t += mode.duelAwaySeconds * 1000;
      events.push({ offsetMs: t, type: 'face', payload: { shotIndex: i } });
      t += mode.duelFaceSeconds * 1000;
    }
    events.push({ offsetMs: t, type: 'series_end', payload: {} });
  } else {
    // Standard timed mode: attention → start → shot_targets × N → series_end
    const signalKey = mode.signalType === 'slow' ? 'start' : 'shoot';
    events.push({ offsetMs: t, type: 'attention', payload: {} });
    t += mode.attentionDelay * 1000;
    events.push({ offsetMs: t, type: signalKey, payload: {} });
    const greenLightMs = t;
    for (let i = 0; i < mode.shotTargetSeconds.length; i++) {
      events.push({
        offsetMs: greenLightMs + mode.shotTargetSeconds[i] * 1000,
        type: 'shot_target',
        payload: { shotIndex: i },
      });
    }
    t = greenLightMs + mode.durationSeconds * 1000;
    events.push({ offsetMs: t, type: 'series_end', payload: {} });
  }

  return events;
}

function _buildRealMatchSequence(disciplineId, matchMode) {
  const discipline = getDiscipline(disciplineId);
  const events = [];
  let cursor = 0;
  const rest = matchMode.restBetweenSeries * 1000;
  const stageBreak = matchMode.restBetweenStages * 1000;

  const stages = matchMode.stages ?? _buildHalfPatternStages(matchMode);
  const stageCount = stages.length;

  for (let si = 0; si < stageCount; si++) {
    const stage = stages[si];
    const mode = getMode(disciplineId, stage.modeId);

    for (let seriesIdx = 0; seriesIdx < stage.count; seriesIdx++) {
      const seriesEvents = _buildSingleModeSequence(discipline, mode, cursor);
      events.push(...seriesEvents);
      // cursor advances to series_end time
      cursor = seriesEvents[seriesEvents.length - 1].offsetMs;

      const isLastSeriesInStage = seriesIdx === stage.count - 1;
      const isLastStage = si === stageCount - 1;

      if (!isLastSeriesInStage || !isLastStage) {
        const breakType = isLastSeriesInStage && !isLastStage ? 'stage_break_start' : 'rest_start';
        const breakDuration = isLastSeriesInStage && !isLastStage ? stageBreak : rest;
        events.push({ offsetMs: cursor, type: breakType, payload: { durationMs: breakDuration } });
        cursor += breakDuration;
        const endType = breakType === 'stage_break_start' ? 'stage_break_end' : 'rest_end';
        events.push({ offsetMs: cursor, type: endType, payload: {} });
      }
    }
  }

  events.push({ offsetMs: cursor, type: 'match_end', payload: {} });
  return events;
}

// Expands rapid_fire real_match halfPattern across halves into flat stages array
function _buildHalfPatternStages(matchMode) {
  const stages = [];
  for (let h = 0; h < matchMode.halves; h++) {
    stages.push(...matchMode.halfPattern);
  }
  return stages;
}
