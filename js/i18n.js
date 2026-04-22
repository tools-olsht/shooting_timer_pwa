const TRANSLATIONS = {
  en: {
    // App
    'app.title': 'Shooting Timer',
    'nav.back': 'Back',
    'nav.select_discipline': 'Select Discipline',

    // Disciplines
    'discipline.standard_pistol.name': 'Standard Pistol (25m)',
    'discipline.standard_pistol.subtitle': "Men's · .22 caliber · 60 shots",
    'discipline.pistol_25m.name': '25m Pistol / Center Fire',
    'discipline.pistol_25m.subtitle': "Women's .22 LR · Men's .32 · 60 shots",
    'discipline.rapid_fire.name': 'Rapid Fire Pistol (25m)',
    'discipline.rapid_fire.subtitle': "Men's · 5 targets · 60 shots",

    // Discipline descriptions (for info dialog)
    'discipline.standard_pistol.desc': 'Standard Pistol bridges the gap between slow-fire precision and rapid-fire shooting. Competitors fire 60 shots at 25 meters using a .22 caliber pistol, divided into three stages of 20 shots each (4 series of 5 shots). Each stage progressively reduces the time allowed to fire.',
    'discipline.standard_pistol.rules': 'Stage 1: 4 series × 5 shots in 150 seconds each.\nStage 2: 4 series × 5 shots in 20 seconds each. Arm starts at 45° angle.\nStage 3: 4 series × 5 shots in 10 seconds each. Arm starts at 45° angle.\nPreparation time: 1 minute before each stage. Rest: ~12 seconds between series.',

    'discipline.pistol_25m.desc': "These events share the same format, differing only in participants and caliber (.22 LR for Women's 25m Pistol; .32 or heavier for Men's Center Fire). The match is split into a slow-fire Precision stage and a dynamic Duel (rapid-fire) stage.",
    'discipline.pistol_25m.rules': 'Precision: 6 series × 5 shots in 300 seconds each. Pistol may rest between shots.\nDuel: 6 series of 5 shots. Each shot: target faces for 3 seconds, then turns away for 7 seconds. Shooter raises arm from 45° and fires one shot per exposure.\nTotal: 60 shots (30 precision + 30 duel).',

    'discipline.rapid_fire.desc': 'One of the oldest and most explosive Olympic shooting events, focused entirely on speed and muscle memory. Shooters must fire one shot at each of five adjacent targets during every series.',
    'discipline.rapid_fire.rules': 'Match: 60 shots in 2 halves of 30 shots each.\nEach half: 2 series × 8s + 2 series × 6s + 2 series × 4s.\nEach series: 5 shots at 5 adjacent targets (one shot per target).\nSignal: Attention → 3-second delay → Green light → timer starts.\nRest: ~12 seconds between series.',

    // Modes
    'mode.150s.name': '150 Seconds',
    'mode.150s.desc': 'First stage of Standard Pistol. Fire 5 shots within 150 seconds. Start from any position. Good time to focus on breath control and trigger technique.',
    'mode.150s.rules': '5 shots per series · 150 seconds · Practice mode loops series continuously.\nTraining tip: Aim for shots at ~30, 60, 90, 120, and 145 seconds for optimal pacing.',

    'mode.20s.name': '20 Seconds',
    'mode.20s.desc': 'Second stage of Standard Pistol. Fire 5 shots within 20 seconds. Arm must be at 45° angle when the start signal is given.',
    'mode.20s.rules': '5 shots per series · 20 seconds · Arm starts at 45°.\nTraining tip: Targets shown at ~2, 6, 10, 14, and 17 seconds.',

    'mode.10s.name': '10 Seconds',
    'mode.10s.desc': 'Third and final stage of Standard Pistol. Fire 5 shots within 10 seconds. The most demanding timing of the event. Arm must be at 45° when the start signal is given.',
    'mode.10s.rules': '5 shots per series · 10 seconds · Arm starts at 45°.\nTraining tip: First shot at ~3s, then evenly distributed. Targets shown at 3, 4.5, 6, 7.5, 9 seconds.',

    'mode.240s.name': '240 Seconds',
    'mode.240s.desc': 'New competition precision stage of 25m Pistol / Center Fire (ISSF rule change). Fire 5 shots within 240 seconds (4 minutes). The pistol may rest on a surface between shots.',
    'mode.240s.rules': '5 shots per series · 240 seconds · Pistol may rest between shots.\nTraining tip: Targets shown at 48, 96, 144, 192, 232 seconds for ideal pacing.',

    'mode.300s.name': '300 Seconds',
    'mode.300s.desc': 'Legacy precision stage of 25m Pistol / Center Fire. Fire 5 shots within 300 seconds (5 minutes). The pistol may rest on a surface between shots.',
    'mode.300s.rules': '5 shots per series · 300 seconds · Pistol may rest between shots.\nTraining tip: Targets shown at 60, 120, 180, 240, 290 seconds for ideal pacing.',

    'mode.duel.name': 'Duel',
    'mode.duel.desc': 'Rapid-fire stage of 25m Pistol / Center Fire. The target alternates between facing away (7 seconds) and facing the shooter (3 seconds). Fire exactly one shot per exposure from a 45° arm position.',
    'mode.duel.rules': 'Per series: 5 exposures × (7s away + 3s face) = 50 seconds total.\n1 shot per 3-second exposure · Arm starts at 45°.\nUse the Loop button to repeat the 5-shot series continuously with rest between.',

    'mode.8s.name': '8 Seconds',
    'mode.8s.desc': 'Rapid Fire series with 8-second time limit. Fire one shot at each of 5 adjacent targets. The longest time series in Rapid Fire — focus on smooth swing and rhythm.',
    'mode.8s.rules': '5 shots at 5 targets · 8 seconds · Arm starts at 45°.\nTraining tip: Targets shown at 3, 4.2, 5.4, 6.6, 7.8 seconds. 12s rest between series when looping.',

    'mode.6s.name': '6 Seconds',
    'mode.6s.desc': 'Rapid Fire series with 6-second time limit. The middle speed requires a well-established rhythm between the swing and trigger pull.',
    'mode.6s.rules': '5 shots at 5 targets · 6 seconds · Arm starts at 45°.\nTraining tip: Targets shown at 2.5, 3.4, 4.3, 5.2, 6 seconds. 12s rest between series when looping.',

    'mode.4s.name': '4 Seconds',
    'mode.4s.desc': 'Rapid Fire series with 4-second time limit. The fastest and most demanding series. Requires pure muscle memory and a pre-programmed swing movement.',
    'mode.4s.rules': '5 shots at 5 targets · 4 seconds · Arm starts at 45°.\nTraining tip: Targets shown at 2, 2.5, 3, 3.5, 4 seconds. 12s rest between series when looping.',

    'mode.real_match.name': 'Real Match',
    'mode.real_match.desc': 'Full competition simulation following ISSF rules. Combines all stages in the correct order with official rest times between series and stages.',

    'mode.real_match.standard_pistol.rules': 'Sighting: 1 × 150s trial series\nBlock 1: 4 × 150s (60s loading between series) → 3 min break\nBlock 2: 4 × 20s (60s loading between series) → 3 min break\nBlock 3: 4 × 10s (60s loading between series)\nAttention: 7s · Total: 60 scored shots',

    'mode.real_match.pistol_25m.rules': 'Precision — Sighting: 1 × 240s trial · 6 × 240s (60s loading between) → 3 min break\nDuel — Sighting: 1 × duel trial · 6 × duel series (60s loading between)\nAttention: 7s · Total: 60 scored shots (30 precision + 30 duel)',

    'mode.real_match.rapid_fire.rules': 'Sighting: 1 × 8s trial series\nHalf 1: 2 × 8s → 2 × 6s → 2 × 4s (60s loading between series) → 5 min half break\nHalf 2: 2 × 8s → 2 × 6s → 2 × 4s (60s loading between series)\nAttention: 7s · Total: 60 scored shots',

    // Timer signals
    'signal.prepare': 'PREPARE',
    'signal.attention': 'ATTENTION',
    'signal.sighting': 'SIGHTING',
    'signal.shoot': 'SHOOT',
    'signal.start': 'START',
    'signal.rest': 'REST',
    'signal.loading': 'LOAD',
    'signal.away': 'AWAY',
    'signal.face': 'FACE',
    'signal.ready': 'READY',
    'signal.stage_break': 'STAGE BREAK',
    'signal.half_break': 'HALF BREAK',
    'signal.match_complete': 'MATCH COMPLETE',
    'signal.next_loop': 'NEXT LOOP',

    // Controls
    'btn.play': 'Play',
    'btn.pause': 'Pause',
    'btn.reset': 'Reset',
    'btn.repeat': 'Repeat',
    'btn.loop': 'Loop',
    'btn.sound': 'Sound',
    'btn.close': 'Close',
    'btn.info': 'Info',

    // Labels
    'label.loop_delay': 'Wait between loops',
    'label.loop_delay_unit': 's',
    'label.series': 'Series {current} of {total}',
    'label.stage': 'Stage {current} of {total}',
    'label.half': 'Half {current} of {total}',
    'label.rest_in': 'Next series in {seconds}s',
    'label.select_mode': 'Select Training Mode',
    'label.disciplines': 'Disciplines',
    'label.real_match_last': 'Full Competition',
    'label.sighting_series': 'Sighting Series',

    // Language names (shown in their own language)
    'lang.en': '🇬🇧 English',
    'lang.es': '🇪🇸 Español',
  },

  es: {
    'app.title': 'Temporizador de Tiro',
    'nav.back': 'Volver',
    'nav.select_discipline': 'Seleccionar Disciplina',

    'discipline.standard_pistol.name': 'Pistola Estándar (25m)',
    'discipline.standard_pistol.subtitle': 'Hombres · Calibre .22 · 60 disparos',
    'discipline.pistol_25m.name': 'Pistola 25m / Fuego Central',
    'discipline.pistol_25m.subtitle': 'Mujeres .22 LR · Hombres .32 · 60 disparos',
    'discipline.rapid_fire.name': 'Pistola Velocidad (25m)',
    'discipline.rapid_fire.subtitle': 'Hombres · 5 dianas · 60 disparos',

    'discipline.standard_pistol.desc': 'La Pistola Estándar es el puente entre el tiro de precisión lento y el tiro rápido. Los tiradores realizan 60 disparos a 25 metros con pistola de calibre .22, divididos en tres fases de 20 disparos cada una (4 series de 5 disparos), con tiempos progresivamente más cortos.',
    'discipline.standard_pistol.rules': 'Fase 1: 4 series × 5 disparos en 150 segundos.\nFase 2: 4 series × 5 disparos en 20 segundos. Brazo a 45°.\nFase 3: 4 series × 5 disparos en 10 segundos. Brazo a 45°.\nPreparación: 1 minuto antes de cada fase. Descanso: ~12s entre series.',

    'discipline.pistol_25m.desc': 'Estas pruebas comparten el mismo formato, diferenciándose solo en participantes y calibre (.22 LR para mujeres; .32 o superior para hombres). La competición se divide en una fase de precisión a ritmo lento y una fase de duelo (fuego rápido).',
    'discipline.pistol_25m.rules': 'Precisión: 6 series × 5 disparos en 300 segundos. La pistola puede descansar entre disparos.\nDuelo: 6 series de 5 disparos. Cada disparo: diana de frente 3 segundos, luego de costado 7 segundos. Se eleva el brazo desde 45° y se dispara una vez por exposición.\nTotal: 60 disparos (30 precisión + 30 duelo).',

    'discipline.rapid_fire.desc': 'Una de las pruebas olímpicas más antiguas y explosivas, centrada en la velocidad y la memoria muscular. Los tiradores deben disparar una vez a cada una de cinco dianas adyacentes en cada serie.',
    'discipline.rapid_fire.rules': 'Competición: 60 disparos en 2 mitades de 30 disparos.\nCada mitad: 2 series × 8s + 2 series × 6s + 2 series × 4s.\nCada serie: 5 disparos a 5 dianas adyacentes (un disparo por diana).\nSeñal: Atención → 3 segundos → Luz verde → comienza el cronómetro.\nDescanso: ~12 segundos entre series.',

    'mode.150s.name': '150 Segundos',
    'mode.150s.desc': 'Primera fase de Pistola Estándar. Dispara 5 veces en 150 segundos. Puedes empezar desde cualquier posición. Aprovecha el tiempo para el control de la respiración y la técnica del gatillo.',
    'mode.150s.rules': '5 disparos por serie · 150 segundos · El modo práctica repite la serie en bucle.\nConsejo: Las dianas aparecen a los ~30, 60, 90, 120 y 145 segundos.',

    'mode.20s.name': '20 Segundos',
    'mode.20s.desc': 'Segunda fase de Pistola Estándar. Dispara 5 veces en 20 segundos. El brazo debe estar a 45° cuando se da la señal de inicio.',
    'mode.20s.rules': '5 disparos por serie · 20 segundos · Brazo a 45°.\nConsejo: Dianas a los ~2, 6, 10, 14 y 17 segundos.',

    'mode.10s.name': '10 Segundos',
    'mode.10s.desc': 'Tercera y última fase de Pistola Estándar. Dispara 5 veces en 10 segundos. La más exigente. El brazo debe estar a 45° cuando se da la señal.',
    'mode.10s.rules': '5 disparos por serie · 10 segundos · Brazo a 45°.\nConsejo: Primer disparo a los ~3s. Dianas a los 3, 4.5, 6, 7.5, 9 segundos.',

    'mode.240s.name': '240 Segundos',
    'mode.240s.desc': 'Nueva fase de precisión de competición de Pistola 25m / Fuego Central (cambio de reglamento ISSF). Dispara 5 veces en 240 segundos (4 minutos). La pistola puede descansar entre disparos.',
    'mode.240s.rules': '5 disparos por serie · 240 segundos · La pistola puede descansar.\nConsejo: Dianas a los 48, 96, 144, 192, 232 segundos.',

    'mode.300s.name': '300 Segundos',
    'mode.300s.desc': 'Fase de precisión antigua de Pistola 25m / Fuego Central. Dispara 5 veces en 300 segundos (5 minutos). La pistola puede descansar entre disparos.',
    'mode.300s.rules': '5 disparos por serie · 300 segundos · La pistola puede descansar.\nConsejo: Dianas a los 60, 120, 180, 240, 290 segundos.',

    'mode.duel.name': 'Duelo',
    'mode.duel.desc': 'Fase de fuego rápido de Pistola 25m / Fuego Central. La diana alterna entre estar de costado (7 segundos) y de frente (3 segundos). Dispara exactamente una vez por exposición desde 45°.',
    'mode.duel.rules': 'Por serie: 5 exposiciones × (7s de costado + 3s de frente) = 50 segundos.\n1 disparo por exposición de 3 segundos · Brazo a 45°.\nUsa el botón Bucle para repetir la serie de 5 disparos continuamente.',

    'mode.8s.name': '8 Segundos',
    'mode.8s.desc': 'Serie de Fuego Rápido con límite de 8 segundos. Dispara una vez a cada una de 5 dianas adyacentes. La serie más larga de Pistola Velocidad — concéntrate en el ritmo.',
    'mode.8s.rules': '5 disparos a 5 dianas · 8 segundos · Brazo a 45°.\nConsejo: Dianas a los 3, 4.2, 5.4, 6.6, 7.8 segundos. Descanso 12s entre series en bucle.',

    'mode.6s.name': '6 Segundos',
    'mode.6s.desc': 'Serie de Fuego Rápido con límite de 6 segundos. La velocidad media requiere un ritmo bien establecido entre el balanceo y el disparo.',
    'mode.6s.rules': '5 disparos a 5 dianas · 6 segundos · Brazo a 45°.\nConsejo: Dianas a los 2.5, 3.4, 4.3, 5.2, 6 segundos. Descanso 12s entre series en bucle.',

    'mode.4s.name': '4 Segundos',
    'mode.4s.desc': 'Serie de Fuego Rápido con límite de 4 segundos. La más rápida y exigente. Requiere memoria muscular pura y un movimiento de balanceo preprogramado.',
    'mode.4s.rules': '5 disparos a 5 dianas · 4 segundos · Brazo a 45°.\nConsejo: Dianas a los 2, 2.5, 3, 3.5, 4 segundos. Descanso 12s entre series en bucle.',

    'mode.real_match.name': 'Competición Real',
    'mode.real_match.desc': 'Simulación completa de competición siguiendo las reglas ISSF. Combina todas las fases en el orden correcto con tiempos de descanso oficiales entre series y fases.',

    'mode.real_match.standard_pistol.rules': 'Prueba: 1 × 150s serie de prueba\nBloque 1: 4 × 150s (60s carga entre series) → 3 min pausa\nBloque 2: 4 × 20s (60s carga entre series) → 3 min pausa\nBloque 3: 4 × 10s (60s carga entre series)\nAtención: 7s · Total: 60 disparos de competición',

    'mode.real_match.pistol_25m.rules': 'Precisión — Prueba: 1 × 240s · 6 × 240s (60s carga entre series) → 3 min pausa\nDuelo — Prueba: 1 × duelo · 6 × series de duelo (60s carga entre series)\nAtención: 7s · Total: 60 disparos (30 precisión + 30 duelo)',

    'mode.real_match.rapid_fire.rules': 'Prueba: 1 × 8s serie de prueba\nMitad 1: 2 × 8s → 2 × 6s → 2 × 4s (60s carga entre series) → 5 min pausa\nMitad 2: 2 × 8s → 2 × 6s → 2 × 4s (60s carga entre series)\nAtención: 7s · Total: 60 disparos de competición',

    'signal.prepare': 'PREPARACIÓN',
    'signal.attention': 'ATENCIÓN',
    'signal.sighting': 'PRUEBA',
    'signal.shoot': 'FUEGO',
    'signal.start': 'INICIO',
    'signal.rest': 'DESCANSO',
    'signal.loading': 'CARGAR',
    'signal.away': 'COSTADO',
    'signal.face': 'FRENTE',
    'signal.ready': 'LISTO',
    'signal.stage_break': 'PAUSA DE FASE',
    'signal.half_break': 'PAUSA DE MITAD',
    'signal.match_complete': 'Competición COMPLETA',
    'signal.next_loop': 'PRÓXIMO BUCLE',

    'btn.play': 'Iniciar',
    'btn.pause': 'Pausar',
    'btn.reset': 'Reiniciar',
    'btn.repeat': 'Repetir',
    'btn.loop': 'Bucle',
    'btn.sound': 'Sonido',
    'btn.close': 'Cerrar',
    'btn.info': 'Info',

    'label.loop_delay': 'Espera entre bucles',
    'label.loop_delay_unit': 's',
    'label.series': 'Serie {current} de {total}',
    'label.stage': 'Fase {current} de {total}',
    'label.half': 'Mitad {current} de {total}',
    'label.rest_in': 'Próxima serie en {seconds}s',
    'label.select_mode': 'Seleccionar Modo de Entrenamiento',
    'label.disciplines': 'Disciplinas',
    'label.real_match_last': 'Competición Completa',
    'label.sighting_series': 'Serie de Prueba',

    'lang.en': '🇬🇧 English',
    'lang.es': '🇪🇸 Español',
  },
};

let _lang = 'en';
const _listeners = new Set();

export function init() {
  const stored = localStorage.getItem('lang');
  if (stored && TRANSLATIONS[stored]) {
    _lang = stored;
  } else {
    _lang = (navigator.language || 'en').startsWith('es') ? 'es' : 'en';
  }
}

export function t(key, vars = {}) {
  const dict = TRANSLATIONS[_lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}

export function getLang() { return _lang; }

export function setLang(lang) {
  if (!TRANSLATIONS[lang] || _lang === lang) return;
  _lang = lang;
  localStorage.setItem('lang', lang);
  _listeners.forEach(fn => fn(lang));
  // Update all elements with data-i18n-key
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.dataset.i18nKey;
    const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : {};
    el.textContent = t(key, vars);
  });
}

export function onLangChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export const SUPPORTED_LANGS = ['en', 'es'];
