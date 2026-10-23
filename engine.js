/**
 * VÉSICA — deterministic educational scenarios, not a physiological predictor.
 * Values, trajectories and compressed drainage time are illustrative.
 * See CLINICAL_SOURCES.md for clinical rules and validation limits.
 */
export const CASES = [
  {
    id: 'male', label: 'Retención aguda', title: 'Retención urinaria · adulto', sex: 'male', age: 68,
    patient: 'Jorge Martínez', history: 'Dolor suprapúbico e imposibilidad de orinar desde hace 8 horas. Antecedente de hiperplasia prostática.',
    brief: 'Retención confirmada por ecografía vesical. Existe indicación documentada de drenaje. Está consciente y puede consentir.',
    findings: ['Globo vesical doloroso', 'Sin sangre en el meato ni antecedente de trauma', 'Sin alergias conocidas'],
    baseline: { hr: 102, rr: 22, sys: 148, dia: 86, pain: 8 }, volume: 820,
    firstLine: 'Me duele mucho aquí abajo. Desde esta mañana no puedo orinar. ¿Me va a doler?',
    balloonMl: 10, device: 'Sonda de silicona 14 Fr; balón de 10 mL según la ficha del dispositivo ficticio.'
  },
  {
    id: 'female', label: 'Posoperatorio', title: 'Retención posoperatoria · adulta', sex: 'female', age: 54,
    patient: 'Elena Castro', history: 'Retención tras cirugía no urológica. Refiere alergia al látex. Ansiosa por la exposición corporal.',
    brief: 'Retención confirmada de 650 mL. Drenaje indicado tras valorar alternativas. Pide explicación y privacidad.',
    findings: ['Alergia al látex documentada', 'Sin sospecha de lesión uretral', 'Necesita ayuda para una posición cómoda'],
    baseline: { hr: 96, rr: 20, sys: 136, dia: 82, pain: 6 }, volume: 650,
    firstLine: 'No puedo orinar desde la operación. Soy alérgica al látex; por favor, ténganlo en cuenta.',
    balloonMl: 10, device: 'Sonda de silicona sin látex 12 Fr; balón de 10 mL según la ficha del dispositivo ficticio.'
  },
  {
    id: 'difficult', label: 'Resistencia al avance', title: 'Cateterismo difícil · detener y escalar', sex: 'male', age: 73,
    patient: 'Ricardo Gómez', history: 'Retención dolorosa, cirugía uretral previa y episodios de sondaje difícil. El caso puede requerir valoración especializada.',
    brief: 'Indicación de drenaje confirmada. No se conocen signos de trauma reciente. Debes identificar el límite de un intento seguro.',
    findings: ['Antecedente de intervención uretral', 'Sin sangre inicial en el meato', 'Resistencia prevista por el guion, no por la fuerza del estudiante'],
    baseline: { hr: 100, rr: 21, sys: 146, dia: 84, pain: 7 }, volume: 760,
    firstLine: 'La última vez les costó mucho ponerme la sonda. Me da miedo que vuelvan a hacerme daño.',
    balloonMl: 10, device: 'Sonda de silicona 14 Fr; balón de 10 mL según la ficha del dispositivo ficticio.'
  },
  {
    id: 'trauma', label: 'Trauma uretral sospechado', title: 'Trauma pélvico · decisión de seguridad', sex: 'male', age: 32,
    patient: 'Andrés Rojas', history: 'Accidente de tránsito, posible fractura pélvica y sangre en el meato. Evaluación inicial del trauma en curso.',
    brief: 'Se solicita valorar el drenaje. No existe autorización para instrumentación uretral a ciegas ante esta sospecha de lesión.',
    findings: ['Sangre en el meato', 'Mecanismo compatible con lesión pélvica', 'Requiere valoración especializada antes de instrumentar'],
    baseline: { hr: 108, rr: 24, sys: 114, dia: 74, pain: 7 }, volume: 450,
    firstLine: 'Me duele desde el accidente. He visto sangre. ¿Qué me van a hacer?',
    balloonMl: 10, device: 'No iniciar sondaje uretral a ciegas: solicitar evaluación especializada.'
  }
];

export const STAGES = [
  { id: 'assessment', short: 'Valoración', title: 'Valora a la persona', description: 'Comprueba la indicación, identidad, consentimiento, alergias y signos que desaconsejan instrumentar.' },
  { id: 'position', short: 'Preparación', title: 'Prepara entorno y posición', description: 'Preserva intimidad, comodidad e iluminación. Realiza la higiene perineal inicial que corresponda.' },
  { id: 'hygiene', short: 'Higiene', title: 'Higiene de manos', description: 'Representa la higiene de manos antes de manipular material. En la práctica respeta producto, técnica y tiempo.' },
  { id: 'equipment', short: 'Dispositivo', title: 'Selecciona y revisa el equipo', description: 'Revisa indicación, calibre, integridad, caducidad, alergias y las instrucciones del fabricante.' },
  { id: 'field', short: 'Asepsia', title: 'Establece el campo estéril', description: 'Usa guantes y equipo estériles. Reconoce y sustituye el material que pierda la esterilidad.' },
  { id: 'antisepsis', short: 'Limpieza', title: 'Prepara el meato', description: 'Usa la solución del protocolo local, material nuevo por pasada y el tiempo de contacto/secado indicado.' },
  { id: 'lubrication', short: 'Lubricación', title: 'Lubrica y prepara el sistema', description: 'Lubricante estéril hidrosoluble y sistema de drenaje cerrado. Sigue el producto y protocolo indicados.' },
  { id: 'insertion', short: 'Inserción', title: 'Avanza sin forzar', description: 'Observa respuesta y resistencia. El porcentaje representa un recorrido esquemático, no centímetros ni fuerza real.' },
  { id: 'confirmation', short: 'Verificación', title: 'Comprueba la posición', description: 'El retorno de orina no basta por sí solo. Comprueba que la zona del balón esté completamente intravesical.' },
  { id: 'balloon', short: 'Balón', title: 'Infla según el dispositivo', description: 'Solo con posición intravesical verificada. El volumen es el de la ficha de este dispositivo ficticio, no una regla universal.' },
  { id: 'drainage', short: 'Drenaje', title: 'Fija y comprueba el drenaje', description: 'Evita tracción, acodamientos y desconexiones. Mantén el colector bajo la vejiga y sin tocar el suelo.' },
  { id: 'record', short: 'Reevaluación', title: 'Reevalúa y documenta', description: 'Cierra la técnica, registra tolerancia, dispositivo y drenaje; deja un plan de revisión de la indicación.' }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const approach = (value, target, dt, tau = 5) => value + (target - value) * (1 - Math.exp(-dt / tau));
const copy = value => JSON.parse(JSON.stringify(value));
const ACTIONS = {
  identify: ['Confirmar dos identificadores', 'secondary'], explain: ['Explicar y tranquilizar', 'secondary'],
  consent: ['Obtener consentimiento', 'secondary'], allergies: ['Consultar alergias', 'secondary'],
  assess_risk: ['Revisar antecedentes y meato', 'secondary'], indication: ['Verificar indicación y alternativas', 'secondary'],
  proceed_unassessed: ['Omitir comprobaciones y continuar', 'danger'], defer: ['Suspender instrumentación y derivar', 'primary'],
  privacy: ['Preservar intimidad', 'secondary'], position: ['Colocar en posición cómoda', 'secondary'],
  preclean: ['Realizar higiene perineal inicial', 'secondary'], skip_position: ['Continuar sin preparar el entorno', 'danger'],
  hand_hygiene: ['Realizar higiene de manos', 'primary'], skip_hygiene: ['Continuar sin higiene de manos', 'danger'],
  check_equipment: ['Revisar envases y ficha del dispositivo', 'secondary'], choose_device: ['Elegir sonda de silicona sin látex', 'primary'],
  latex_device: ['Elegir dispositivo de látex', 'danger'], skip_equipment: ['Continuar sin revisar el equipo', 'danger'],
  sterile_gloves: ['Colocar guantes estériles', 'secondary'], drape: ['Desplegar campo estéril', 'primary'],
  touch_nonsterile: ['Tocar la sonda tras tocar la cama', 'danger'], replace_sterile: ['Sustituir material contaminado', 'primary'],
  skip_field: ['Continuar sin campo estéril', 'danger'], clean: ['Limpiar con material nuevo por pasada', 'primary'],
  wait_dry: ['Respetar contacto y secado del producto', 'secondary'], skip_antisepsis: ['Continuar sin preparación del meato', 'danger'],
  lubricant: ['Aplicar lubricante estéril hidrosoluble', 'primary'], closed_system: ['Preparar circuito cerrado', 'secondary'],
  skip_lubrication: ['Continuar sin lubricante', 'danger'], advance: ['Avanzar suavemente', 'primary'],
  force: ['Avanzar con mayor fuerza', 'danger'], observe_urine: ['Comprobar retorno de orina', 'secondary'],
  verify_position: ['Comprobar zona del balón intravesical', 'secondary'], confirm: ['Confirmar ambas condiciones', 'primary'],
  premature_balloon: ['Inflar sin completar la verificación', 'danger'], check_balloon_spec: ['Leer volumen y líquido del fabricante', 'secondary'],
  inflate: ['Inflar con lo indicado en la ficha', 'primary'], excessive_volume: ['Añadir más volumen que el indicado', 'danger'],
  deflate: ['Detener inflado y desinflar el balón', 'primary'], secure: ['Fijar sin tracción', 'secondary'],
  bag_below: ['Situar colector bajo la vejiga', 'secondary'], check_flow: ['Revisar flujo y ausencia de acodamientos', 'secondary'],
  foreskin: ['Verificar prepucio recolocado si se retrajo', 'secondary'], lift_bag: ['Elevar el colector sobre la vejiga', 'danger'],
  disconnect: ['Desconectar el circuito para revisarlo', 'danger'], pull: ['Tirar de la sonda con el balón inflado', 'danger'],
  remove_gloves: ['Retirar guantes', 'secondary'], final_hygiene: ['Realizar higiene final de manos', 'secondary'],
  document: ['Documentar dispositivo, tolerancia y plan', 'secondary'], reassess: ['Reevaluar dolor, drenaje y necesidad', 'secondary'],
  finish: ['Cerrar y revisar la evaluación', 'primary'], stop: ['Detener la maniobra', 'primary'],
  assess: ['Valorar dolor, sangrado y situación', 'secondary'], call_help: ['Solicitar ayuda y comunicar hallazgos', 'primary'],
  resume: ['Reanudar tras corregir la causa', 'primary'],
  wrong_site: ['Dirigir la sonda hacia la abertura vaginal', 'danger'],
  new_sterile_catheter: ['Sustituir por sonda y sistema estériles nuevos', 'primary']
};

const STAGE_ACTIONS = [
  ['identify', 'indication', 'explain', 'consent', 'allergies', 'assess_risk', 'proceed_unassessed', 'defer'],
  ['privacy', 'position', 'preclean', 'skip_position'], ['hand_hygiene', 'skip_hygiene'],
  ['check_equipment', 'choose_device', 'latex_device', 'skip_equipment'],
  ['sterile_gloves', 'drape', 'touch_nonsterile', 'replace_sterile', 'skip_field'],
  ['clean', 'wait_dry', 'skip_antisepsis'], ['lubricant', 'closed_system', 'skip_lubrication'],
  ['advance', 'wrong_site', 'force', 'premature_balloon'], ['observe_urine', 'verify_position', 'confirm', 'premature_balloon'],
  ['check_balloon_spec', 'inflate', 'excessive_volume'],
  ['secure', 'bag_below', 'check_flow', 'foreskin', 'lift_bag', 'disconnect', 'pull'],
  ['remove_gloves', 'final_hygiene', 'document', 'reassess', 'finish']
];
const FLAG_ACTIONS = {
  identify: 'identified', indication: 'indication', consent: 'consent', allergies: 'allergies', assess_risk: 'riskAssessed',
  privacy: 'privacy', position: 'positioned', preclean: 'preclean', hand_hygiene: 'handHygiene',
  check_equipment: 'equipmentChecked', choose_device: 'deviceSelected', sterile_gloves: 'gloves', drape: 'drape',
  clean: 'cleaned', wait_dry: 'dry', lubricant: 'lubricated', closed_system: 'closedSystem',
  observe_urine: 'urineObserved', verify_position: 'positionVerified', check_balloon_spec: 'balloonSpec',
  secure: 'secured', bag_below: 'bagPositionVerified', check_flow: 'flowChecked', foreskin: 'foreskin',
  remove_gloves: 'glovesRemoved', final_hygiene: 'finalHygiene', document: 'documented', reassess: 'reassessed'
};

export class Simulation {
  constructor(caseId = 'male') {
    const scenario = CASES.find(item => item.id === caseId);
    if (!scenario) throw new RangeError('Caso desconocido');
    this.case = scenario;
    this.caseId = caseId;
    this.stage = 0;
    this.flags = { sterile: true, closedSystem: false, bagBelow: false, forceApplied: false };
    this.completed = [];
    this.skipped = [];
    this.elapsed = 0;
    this.insertion = 0;
    this.placement = 'urethral';
    this.balloon = 0;
    this.drainage = 0;
    this.event = null;
    this.injury = null;
    this.bleeding = false;
    this.infectionRisk = false;
    this.criticalFailure = false;
    this.finished = false;
    this.outcome = null;
    this.paused = false;
    this.errors = [];
    this.log = [];
    this.dialogueId = 0;
    this.dialogue = '';
    this.vitals = { ...scenario.baseline };
    this.lastAction = null;
    this._eventId = 0;
    this._say(scenario.firstLine);
    this._log('Inicio de caso: ' + scenario.title + '. Valores y tiempos docentes, no predicción clínica.', 'info');
  }

  _say(message) {
    if (this.dialogue !== message) {
      this.dialogue = message;
      this.dialogueId += 1;
    }
  }

  _log(message, severity = 'info') {
    this.log.push({ id: this.log.length + 1, time: this.elapsed, severity, message });
  }

  _error(id, message, critical = false, penalty = 8) {
    if (!this.errors.some(item => item.id === id)) {
      this.errors.push({ id, message, critical, penalty, time: this.elapsed });
      this._log(message, critical ? 'critical' : 'warning');
    }
    if (critical) this.criticalFailure = true;
  }

  _incident(id, label, message, severity = 'warning') {
    this.event = { id, label, message, severity, stopped: false, assessed: false, called: false };
    this._eventId += 1;
    this._log(label + ': ' + message, severity);
  }

  _injure(id, label, message, dialogue) {
    this.injury = id;
    this.bleeding = true;
    this._error(id, message, true, 35);
    this._incident(id, label, 'No continuar este intento. Detener, valorar y solicitar ayuda; no realizar nuevos avances.', 'critical');
    this._say(dialogue);
  }

  _doneFlag(action) {
    const key = FLAG_ACTIONS[action];
    if (action === 'explain') return !!this.flags.explained;
    if (action === 'confirm') return !!this.flags.confirmed;
    if (action === 'inflate') return this.balloon === 1;
    if (action === 'replace_sterile') return this.flags.sterile;
    if (action === 'stop') return !!this.event?.stopped;
    if (action === 'assess') return !!this.event?.assessed;
    if (action === 'call_help') return !!this.event?.called;
    if (action === 'new_sterile_catheter') return !!this.event?.replaced;
    return key ? !!this.flags[key] : false;
  }

  _needed() {
    const f = this.flags;
    return [
      f.identified && f.indication && f.explained && f.consent && f.allergies && f.riskAssessed,
      f.privacy && f.positioned && f.preclean,
      f.handHygiene,
      f.equipmentChecked && f.deviceSelected,
      f.gloves && f.drape && f.sterile,
      f.cleaned && f.dry,
      f.lubricated && f.closedSystem,
      this.insertion >= 100,
      f.confirmed,
      this.balloon === 1,
      f.secured && f.bagBelow && f.bagPositionVerified && f.flowChecked && f.closedSystem && (this.case.sex === 'female' || f.foreskin),
      f.glovesRemoved && f.finalHygiene && f.documented && f.reassessed
    ][this.stage];
  }

  get stageComplete() {
    return !this.event && !this.injury && (!!this._needed() || this.skipped.includes(this.stage));
  }

  _completeOutcome(outcome) {
    this.finished = true;
    this.outcome = outcome;
    this._log(outcome === 'completed' ? 'Práctica completada y registrada.' : 'Intento suspendido; hallazgos comunicados para valoración especializada.', this.criticalFailure ? 'critical' : 'success');
  }

  _closeReferralIfReady() {
    if (!this.event?.called || !this.event.stopped || !this.event.assessed) return false;
    if (this.balloon && ['urethral_balloon', 'unverified_balloon', 'balloon_overfill', 'balloon_volume'].includes(this.event.id)) return false;
    this._completeOutcome(this.criticalFailure ? 'injury_referral' : 'safe_referral');
    this._say(this.injury ? 'Por favor, quédese conmigo mientras viene el equipo.' : 'Gracias por no insistir y pedir que me valoren.');
    return true;
  }

  _inflate(volume, premature = false) {
    const n = Number(volume);
    if (!Number.isFinite(n) || n <= 0) return this._result(false, 'Volumen no válido.', 'warning');
    if (this.balloon) return this._result(false, 'El balón ya está inflado. No añadir volumen.', 'warning');
    if (this.caseId === 'trauma' || this.insertion < 100) {
      this.balloon = 0.6;
      this._injure('urethral_balloon', 'Inflado en posición no segura', 'Inflado sin zona del balón intravesical: lesión uretral simulada. Es un fallo crítico.', '¡Pare, me duele muchísimo! Siento un dolor muy fuerte ahí.');
      return this._result(false, 'Dolor intenso y sangrado. Detén el inflado, desinfla, valora y solicita ayuda.', 'critical');
    }
    if (!this.flags.confirmed || premature) {
      this._error('unverified_balloon', 'Inflado sin completar las verificaciones de posición. Aunque el dibujo esté intravesical, la conducta no es segura.', true, 25);
      this._incident('unverified_balloon', 'Inflado sin verificar', 'Detén el inflado y reevalúa la posición. Solicita supervisión antes de otro intento.', 'critical');
      this.balloon = 0.5;
      this._say('Siento molestia. ¿Ha comprobado que está bien colocado?');
      return this._result(false, 'Faltan verificaciones de seguridad. Detener y reevaluar.', 'critical');
    }
    if (n > this.case.balloonMl) {
      this.balloon = 1;
      this._injure('balloon_overfill', 'Volumen de balón incorrecto', 'Se excedió el volumen de la ficha del dispositivo ficticio. Riesgo de lesión por sobreinflado; no continuar.', '¡Me duele! Pare, por favor.');
      return this._result(false, 'Detén el inflado y solicita valoración.', 'critical');
    }
    if (n < this.case.balloonMl) {
      this._error('balloon_underfill', 'Se indicó menos volumen que el prescrito por el fabricante para el dispositivo del caso; fijación no verificada.', false, 10);
      this._incident('balloon_volume', 'Volumen de balón no conforme', 'Detener, reevaluar y consultar la ficha/supervisión. No improvisar volúmenes.');
      this.balloon = n / this.case.balloonMl;
      return this._result(false, 'Volumen distinto de la ficha. No se presupone lesión ni estabilidad del dispositivo.', 'warning');
    }
    if (!this.flags.balloonSpec) this._error('manufacturer_unchecked', 'Se infló sin consultar las instrucciones del dispositivo.', false, 8);
    this.balloon = 1;
    this._say('Noto un poco de molestia, pero no un dolor fuerte.');
    this._log('Balón intravesical representado con el volumen de la ficha del caso.', 'success');
    return this._result(true, 'Balón representado. Vigila tolerancia y prepara fijación sin tracción.', 'success');
  }

  _result(ok, message, severity = 'info') {
    this.lastAction = { ok, message, severity };
    return this.lastAction;
  }

  dispatch(action, payload = {}) {
    if (typeof action !== 'string') return this._result(false, 'Acción no válida.', 'warning');
    if (!payload || typeof payload !== 'object') payload = {};
    if (action === 'pause') {
      if (this.finished) return this._result(false, 'La práctica ya terminó.');
      this.paused = !this.paused;
      return this._result(true, this.paused ? 'Paciente y reloj en pausa.' : 'Evolución reanudada.');
    }
    if (this.finished) return this._result(false, 'El intento terminó. Revisa el debriefing o inicia otro caso.');
    if (this.paused) return this._result(false, 'Reanuda el paciente antes de intervenir.');

    if (action === 'explain') {
      if (!this.flags.explained) this._log('Se explicó el procedimiento y se ofreció acompañamiento.', 'success');
      this.flags.explained = true;
      this._say(this.injury ? 'Gracias, pero sigo con dolor. Necesito que me valoren.' : 'Gracias por explicármelo. Avíseme antes de hacer algo, por favor.');
      return this._result(true, 'La explicación reduce ansiedad; no elimina dolor ni corrige una lesión.', 'success');
    }
    if (action === 'stop') {
      if (!this.event) this._incident('pause_attempt', 'Maniobra detenida', 'Valora la situación antes de decidir si continuar o pedir ayuda.', 'info');
      this.event.stopped = true;
      this._log('El estudiante detuvo la maniobra.', 'success');
      this._say(this.injury ? 'Gracias por parar. Todavía me duele mucho.' : 'Gracias por detenerse. Dígame qué está pasando.');
      this._closeReferralIfReady();
      return this._result(true, 'Maniobra detenida. Valora y comunica los hallazgos.');
    }
    if (action === 'assess') {
      if (!this.event) return this._result(true, 'Reevaluación: ' + this.case.findings.join('. ') + '.');
      this.event.assessed = true;
      this._log('Se reevaluaron dolor, sangrado, resistencia y situación del paciente.', 'success');
      this._closeReferralIfReady();
      return this._result(true, this.injury ? 'Hay dolor intenso y sangrado simulado. Este intento no debe continuar.' : this.event.message);
    }
    if (action === 'call_help') {
      if (!this.event) {
        this._incident('referral', 'Solicitud de valoración', 'Se comunica indicación, antecedentes y hallazgos al equipo.', 'info');
        this.event.stopped = true;
        this.event.assessed = true;
      }
      this.event.called = true;
      this._log('Se solicitó ayuda y se comunicaron los hallazgos con estructura SAER.', 'success');
      if (!this.event.stopped || !this.event.assessed) return this._result(true, 'Ayuda solicitada. Todavía debes detener y valorar al paciente.');
      if (this.balloon && ['urethral_balloon', 'unverified_balloon', 'balloon_overfill', 'balloon_volume'].includes(this.event.id)) return this._result(true, 'Ayuda solicitada. Detén y desinfla el balón antes de cerrar el intento.');
      this._closeReferralIfReady();
      return this._result(true, this.criticalFailure ? 'Intento cerrado tras fallo crítico. La atención adecuada posterior no borra la lesión.' : 'Suspensión y derivación seguras.', this.criticalFailure ? 'critical' : 'success');
    }
    if (action === 'deflate') {
      if (!this.balloon) return this._result(false, 'No hay balón inflado.');
      this.balloon = 0;
      this._log('Se detuvo el inflado y se desinfló el balón.', 'success');
      this._closeReferralIfReady();
      return this._result(true, 'Balón desinflado. La lesión o el fallo de seguridad permanecen en la evaluación.');
    }
    if (action === 'resume') {
      if (!this.event?.stopped || !this.event.assessed) return this._result(false, 'Primero detén y valora.');
      if (this.criticalFailure || this.injury || ['resistance', 'trauma', 'vagal'].includes(this.event.id)) return this._result(false, 'Este intento requiere valoración especializada; no reanudar.');
      if (this.event.id === 'no_lubrication' && !this.flags.lubricated) return this._result(false, 'Corrige la lubricación con material adecuado antes de considerar otro intento.');
      if (this.event.id === 'vaginal_misplacement' && !this.event.replaced) return this._result(false, 'No reutilices la sonda mal posicionada. Sustituye sonda y sistema por material estéril nuevo.');
      if (this.event.id === 'vaginal_misplacement') {
        this.placement = 'urethral';
        this.flags.vaginalMisplacementCorrected = true;
      }
      this.event = null;
      this._log('Se corrigió la causa y se reanudó el guion docente.', 'info');
      return this._result(true, 'Evolución reanudada. Mantén vigilancia de la tolerancia.');
    }
    if (action === 'next') {
      if (!this.stageComplete) return this._result(false, 'La etapa requiere una decisión o comprobación pendiente.');
      if (this.stage >= 11) return this._result(false, 'Finaliza el registro para cerrar.');
      this.completed.push(this.stage);
      this.stage += 1;
      this._log('Etapa: ' + STAGES[this.stage].title + '.', 'info');
      return this._result(true, STAGES[this.stage].description);
    }

    // While an incident is active only recovery actions may alter the scenario.
    if (this.event) {
      if (action === 'force' && this.event.id === 'resistance') {
        this.flags.forceApplied = true;
        this._injure('forced_resistance', 'Traumatismo por avance forzado', 'Se continuó contra resistencia: lesión uretral y sangrado simulados. Fallo crítico.', '¡No siga! ¡Me está haciendo mucho daño!');
        return this._result(false, 'Dolor intenso y sangrado. No continuar el intento.', 'critical');
      }
      if (action === 'lubricant' && this.event.id === 'no_lubrication') {
        this.flags.lubricated = true;
        return this._result(true, 'Lubricación corregida en el guion. Detén y valora antes de reanudar.');
      }
      if (action === 'new_sterile_catheter' && this.event.id === 'vaginal_misplacement') {
        if (this.event.replaced) return this._result(true, 'Ya se preparó material estéril nuevo. No reutilizar la sonda mal posicionada.');
        this.event.replaced = true;
        this.insertion = 0;
        this.flags.urineObserved = false;
        this.flags.positionVerified = false;
        this.flags.confirmed = false;
        this.flags.urineAnnounced = false;
        this.flags.closedSystem = true;
        this.flags.sterile = true;
        this._log('Se sustituyeron sonda y sistema por material estéril nuevo tras colocación vaginal. No se reutilizó la sonda.', 'success');
        return this._result(true, 'Nuevo dispositivo preparado. Detén y valora antes de reanudar el intento.');
      }
      return this._result(false, 'Atiende primero la incidencia: detener, valorar y decidir la escalada.', 'warning');
    }

    const allowed = STAGE_ACTIONS[this.stage].includes(action);
    if (!allowed) return this._result(false, 'Esa acción no corresponde a la etapa actual.', 'warning');
    if (this._doneFlag(action) && !['replace_sterile'].includes(action)) return this._result(true, 'Comprobación ya registrada.');

    if (action.startsWith('skip_') || action === 'proceed_unassessed') {
      const problems = {
        proceed_unassessed: ['assessment_omitted', 'Se continuó sin completar la valoración, identificación, consentimiento o revisión de riesgos.'],
        skip_position: ['preparation_omitted', 'No se completaron privacidad, posición e higiene perineal inicial.'],
        skip_hygiene: ['hand_hygiene_omitted', 'Se omitió la higiene de manos; riesgo de contaminación.'],
        skip_equipment: ['device_unchecked', 'Se continuó sin comprobar equipo, alergias o dispositivo.'],
        skip_field: ['sterile_field_omitted', 'Se omitió el campo/equipo estéril; riesgo de infección diferida.'],
        skip_antisepsis: ['antisepsis_omitted', 'Se omitió la preparación del meato según el protocolo.'],
        skip_lubrication: ['lubrication_omitted', 'Se omitió la lubricación; aumenta el riesgo de dolor y traumatismo.']
      };
      const [id, message] = problems[action];
      this._error(id, message, false, action === 'proceed_unassessed' ? 15 : 10);
      if (['skip_hygiene', 'skip_field', 'skip_antisepsis'].includes(action)) this.infectionRisk = true;
      if (!this.skipped.includes(this.stage)) this.skipped.push(this.stage);
      return this._result(true, 'Omisión registrada. Puedes continuar para observar las consecuencias del caso.', 'warning');
    }

    if (action === 'defer') {
      this._incident(this.caseId === 'trauma' ? 'trauma' : 'referral', 'Instrumentación suspendida', this.caseId === 'trauma' ? 'Sangre en meato y trauma pélvico: no instrumentar a ciegas; solicitar valoración especializada.' : 'Se detiene el intento para revisión por el equipo.', 'warning');
      this.event.stopped = true;
      this._say('Gracias por comprobarlo antes de hacerme algo.');
      return this._result(true, 'Valora y comunica los hallazgos al equipo.');
    }
    if (action === 'consent' && !this.flags.explained) return this._result(false, 'Explica antes el procedimiento y permite preguntas para obtener un consentimiento informado.');
    if (action === 'latex_device') {
      if (this.caseId === 'female') {
        this._error('latex_selected', 'Se seleccionó un dispositivo de látex pese a la alergia documentada. Selección interceptada antes del contacto; sustituirlo.', false, 12);
        this._say('Le dije que soy alérgica al látex. No use eso, por favor.');
        return this._result(false, 'Elección incompatible con la alergia. Sustituye el dispositivo. No se simula anafilaxia por la mera selección.', 'warning');
      }
      this.flags.deviceSelected = true;
      this._log('Se seleccionó un dispositivo; confirmar material y ficha del fabricante.', 'info');
      return this._result(true, 'Material registrado. En este prototipo la ficha de referencia es la sonda de silicona.');
    }
    if (action === 'sterile_gloves' && !this.flags.handHygiene) {
      this._error('gloves_without_hygiene', 'Los guantes no sustituyen la higiene de manos.', false, 8);
      this.infectionRisk = true;
    }
    if (action === 'drape' && !this.flags.gloves) return this._result(false, 'Coloca guantes estériles antes de manipular el campo.');
    if (action === 'touch_nonsterile') {
      this.flags.sterile = false;
      this.infectionRisk = true;
      this._error('sterility_breach', 'La sonda contactó con material no estéril. Existe riesgo de infección diferida; no se provoca sepsis inmediata.', false, 12);
      return this._result(true, 'Esterilidad perdida. Sustituye material y guantes contaminados.', 'warning');
    }
    if (action === 'replace_sterile') {
      if (this.flags.sterile) return this._result(true, 'No hay contaminación activa identificada.');
      this.flags.sterile = true;
      this.flags.gloves = true;
      this.flags.contaminationCorrected = true;
      if (!this.errors.some(item => ['hand_hygiene_omitted', 'sterile_field_omitted', 'antisepsis_omitted', 'gloves_without_hygiene', 'circuit_opened'].includes(item.id))) this.infectionRisk = false;
      this._log('Se sustituyeron sonda/material y guantes contaminados antes de continuar.', 'success');
      return this._result(true, 'Material sustituido. La decisión y su corrección quedan registradas.', 'success');
    }
    if (action === 'wait_dry' && !this.flags.cleaned) return this._result(false, 'Primero representa la preparación del meato.');
    if (action === 'advance' || action === 'force') return this._advance(action, payload);
    if (action === 'wrong_site') {
      if (this.case.sex !== 'female') return this._result(false, 'Esta acción no corresponde a la anatomía de este caso.');
      this.placement = 'vaginal';
      this.insertion = 30;
      this.flags.urineObserved = false;
      this.flags.positionVerified = false;
      this.flags.confirmed = false;
      this._error('vaginal_misplacement', 'La sonda se dirigió a la vagina y no a la uretra. No reutilizarla; se requiere un nuevo dispositivo estéril.', false, 12);
      this._incident('vaginal_misplacement', 'Colocación vaginal', 'No hay retorno de orina. Detener y revisar referencias anatómicas; usar una sonda y sistema estériles nuevos antes de reintentar.');
      this._say('Siento molestia. ¿Puede revisar antes de seguir?');
      return this._result(false, 'Sin retorno de orina. Revisa posición y sustituye el dispositivo; no infles el balón.', 'warning');
    }
    if (action === 'observe_urine' && this.insertion < 82) return this._result(false, 'No hay retorno de orina observado. No infles para buscar la posición.');
    if (action === 'verify_position' && this.insertion < 100) return this._result(false, 'La zona del balón aún no está completamente intravesical en el esquema.');
    if (action === 'confirm') {
      if (!this.flags.urineObserved || !this.flags.positionVerified || this.insertion < 100) return this._result(false, 'Faltan comprobaciones de retorno de orina y zona del balón intravesical.');
      this.flags.confirmed = true;
      this._log('Retorno de orina y zona del balón intravesical verificados antes del inflado.', 'success');
      return this._result(true, 'Condiciones verificadas. Consulta ahora la ficha del balón.', 'success');
    }
    if (action === 'premature_balloon') return this._inflate(this.case.balloonMl, true);
    if (action === 'inflate') return this._inflate(payload.volume ?? this.case.balloonMl);
    if (action === 'excessive_volume') return this._inflate(this.case.balloonMl * 2);
    if (action === 'lift_bag') {
      this.flags.bagBelow = false;
      this.flags.bagPositionVerified = false;
      this.flags.flowChecked = false;
      this._error('bag_above_bladder', 'Colector elevado sobre la vejiga: drenaje comprometido y riesgo de reflujo.', false, 8);
      return this._result(true, 'El flujo se interrumpe en el guion. Corrige altura y revisa acodamientos.', 'warning');
    }
    if (action === 'disconnect') {
      this.flags.closedSystem = false;
      this.infectionRisk = true;
      this._error('circuit_opened', 'Se desconectó el circuito cerrado. El protocolo puede requerir sustituir sonda y sistema con técnica aséptica.', false, 15);
      this._incident('circuit_breach', 'Circuito desconectado', 'No reconectar como si nada: detener, valorar y solicitar supervisión para sustituir el sistema conforme al protocolo.');
      return this._result(false, 'Esterilidad del circuito comprometida. Solicita supervisión.', 'warning');
    }
    if (action === 'pull') {
      this._injure('balloon_traction', 'Tracción con balón inflado', 'Se aplicó tracción con balón inflado: lesión y sangrado simulados. Fallo crítico.', '¡No tire! ¡Me duele mucho!');
      return this._result(false, 'Dolor intenso y sangrado. Detén y solicita ayuda.', 'critical');
    }
    if (action === 'final_hygiene' && !this.flags.glovesRemoved) return this._result(false, 'Retira primero los guantes.');
    if (action === 'document') {
      const note = typeof payload.note === 'string' ? payload.note.slice(0, 2000) : '';
      this.flags.documented = true;
      this.note = note;
      this._log('Registro docente: dispositivo/material/calibre, balón según fabricante, drenaje, tolerancia y revisión de indicación.', 'success');
      return this._result(true, 'Registro del intento guardado solo en memoria de esta sesión. No introduzcas datos reales.', 'success');
    }
    if (action === 'finish') {
      if (!this.stageComplete) return this._result(false, 'Completa retirada de guantes, higiene, registro y reevaluación.');
      this.completed.push(11);
      this._completeOutcome('completed');
      this._say('Siento más calma. Gracias por explicarme cómo van a seguir vigilándome.');
      return this._result(true, 'Práctica cerrada. Revisa decisiones, omisiones y límites del modelo.', 'success');
    }

    const flag = FLAG_ACTIONS[action];
    if (flag) {
      this.flags[flag] = true;
      if (action === 'closed_system') this.flags.bagBelow = true;
      if (action === 'bag_below') this.flags.bagBelow = true;
      this._log(ACTIONS[action][0] + '.', 'success');
      const responses = {
        identify: 'Sí, ese es mi nombre y mi fecha de nacimiento.', consent: 'Lo he entendido. Puede proceder y le avisaré si me duele.',
        allergies: this.caseId === 'female' ? 'Soy alérgica al látex. Una vez me dio una reacción.' : 'No tengo alergias conocidas.',
        assess_risk: this.caseId === 'trauma' ? 'Vi sangre al intentar orinar después del accidente.' : this.caseId === 'difficult' ? 'Me operaron de la uretra y antes tuvieron dificultades con la sonda.' : 'No he tenido un golpe ni he visto sangre.',
        privacy: 'Gracias por cubrirme. Así me siento mejor.', position: 'Esa posición me resulta más cómoda.',
        lubricant: 'Gracias por avisar. Voy a intentar relajarme.', secure: 'Ahora no noto que tire.',
        reassess: this.injury ? 'Todavía me duele. Necesito que me valoren.' : 'La presión va disminuyendo. Dígame qué debo avisar si me molesta.'
      };
      if (responses[action]) this._say(responses[action]);
      return this._result(true, action === 'check_equipment' || action === 'check_balloon_spec' ? this.case.device : action === 'closed_system' ? 'Sistema cerrado preparado con colector bajo la vejiga y sin tocar el suelo.' : 'Decisión registrada.', 'success');
    }
    return this._result(false, 'Acción no implementada.', 'warning');
  }

  _advance(action, payload) {
    if (this.caseId === 'trauma') {
      this.insertion = 12;
      this._injure('trauma_instrumented', 'Instrumentación contraindicada', 'Se instrumentó a ciegas pese a sangre en el meato y sospecha de lesión uretral. Fallo crítico.', '¡Pare! ¡Me duele mucho y está saliendo más sangre!');
      return this._result(false, 'No continuar la instrumentación. Solicita evaluación especializada.', 'critical');
    }
    const target = payload.value == null ? this.insertion + 10 : Number(payload.value);
    if (!Number.isFinite(target) || target < this.insertion || target > 100 || target <= this.insertion) return this._result(false, 'El avance debe ser progresivo entre la posición actual y 100.');
    if (action === 'force') {
      this.flags.forceApplied = true;
      this._injure('forced_insertion', 'Avance forzado', 'Se avanzó aplicando fuerza. Dolor intenso y traumatismo simulados; no continuar.', '¡Pare, eso me duele mucho!');
      return this._result(false, 'Avance forzado: detén, valora y solicita ayuda.', 'critical');
    }
    if (!this.flags.lubricated) {
      this._incident('no_lubrication', 'Dolor al avance', 'Falta lubricación adecuada. Detén y valora antes de corregir la técnica.');
      this._say('Eso me está doliendo. Pare un momento, por favor.');
      return this._result(false, 'Dolor durante la inserción. No sigas avanzando.', 'warning');
    }
    if (this.caseId === 'difficult' && target >= 55) {
      this.insertion = 55;
      this._incident('resistance', 'Resistencia al avance', 'Se percibe resistencia y dolor. No forzar ni repetir intentos; detener y solicitar valoración.');
      this._say('Me duele y siento que no pasa. ¡No siga empujando!');
      return this._result(false, 'Resistencia y dolor. Decide cómo responder.', 'warning');
    }
    this.insertion = clamp(target, 0, 100);
    this._log('Avance suave: ' + Math.round(this.insertion) + '% del recorrido esquemático.', 'info');
    if (this.insertion >= 82 && !this.flags.urineAnnounced) {
      this.flags.urineAnnounced = true;
      this._say('Parece que empieza a bajar un poco la presión.');
      this._log('Retorno de orina visible. La zona del balón todavía debe comprobarse antes de inflar.', 'info');
    } else if (this.insertion < 82) {
      this._say('Noto molestia, pero no dolor intenso. Siga avisándome.');
    }
    return this._result(true, this.insertion >= 100 ? 'Recorrido completado en el esquema. Verifica retorno y posición antes de inflar.' : 'Avance representado. Vigila tolerancia y resistencia.');
  }

  /** Optional instructor event, not a random consequence of every error. */
  triggerIncident(id) {
    if (this.finished || this.paused || this.event) return false;
    if (id !== 'vagal' || this.stage < 7) return false;
    this._incident('vagal', 'Respuesta vagal programada', 'Mareo con bradicardia e hipotensión en este guion. Detener, valorar y solicitar ayuda; no tratar con más instrumentación.', 'critical');
    this._say('Me estoy mareando... me siento débil. Pare, por favor.');
    return true;
  }

  tick(dt) {
    if (!Number.isFinite(dt) || dt <= 0 || this.paused || this.finished) return;
    dt = Math.min(dt, 5);
    this.elapsed += dt;
    // Flow and timing are compressed for teaching, not a urine-output forecast.
    const canDrain = this.insertion >= 82 && this.flags.closedSystem && this.flags.bagBelow && !this.event && !this.injury;
    if (canDrain) this.drainage = Math.min(this.case.volume, this.drainage + dt * 18);
    const relief = this.drainage / this.case.volume;
    const base = this.case.baseline;
    const reassured = this.flags.explained ? 0.8 : 0;
    let pain = clamp(base.pain - relief * 5 - reassured, 1, 10);
    let hr = base.hr - relief * 17 - reassured * 3;
    let rr = base.rr - relief * 5;
    let sys = base.sys - relief * 15;
    let dia = base.dia - relief * 6;
    if (this.event?.id === 'resistance' || this.event?.id === 'no_lubrication') {
      pain = Math.max(pain, 8);
      hr += 10; rr += 3;
    }
    if (this.injury) {
      pain = 9;
      hr = Math.max(hr, 118);
      rr = Math.max(rr, 27);
      sys = Math.max(sys, base.sys + 10);
    }
    if (this.event?.id === 'vagal') { hr = 48; rr = 22; sys = 86; dia = 52; }
    for (const [key, target] of Object.entries({ pain, hr, rr, sys, dia })) {
      this.vitals[key] = approach(this.vitals[key], target, dt, key === 'pain' ? 4 : 6);
    }
    this.vitals.hr = clamp(this.vitals.hr, 42, 145);
    this.vitals.rr = clamp(this.vitals.rr, 10, 34);
    this.vitals.sys = clamp(this.vitals.sys, 80, 180);
    this.vitals.dia = clamp(this.vitals.dia, 45, 105);
    this.vitals.pain = clamp(this.vitals.pain, 0, 10);
    if (relief >= 0.6 && !this.flags.reliefAnnounced && !this.injury) {
      this.flags.reliefAnnounced = true;
      this._say('La presión ha bajado bastante. Me siento mejor.');
      this._log('Alivio progresivo del dolor por drenaje en el guion. No garantiza la evolución de un paciente real.', 'success');
    }
  }

  _actions() {
    if (this.finished) return [];
    let ids;
    if (this.event) {
      ids = ['stop', 'assess', 'call_help'];
      if (this.balloon) ids.unshift('deflate');
      if (this.event.id === 'resistance') ids.push('force');
      if (this.event.id === 'no_lubrication') ids.push('lubricant', 'resume');
      if (this.event.id === 'vaginal_misplacement') ids.push('new_sterile_catheter', 'resume');
      if (this.event.id === 'pause_attempt') ids.push('resume');
    } else {
      ids = [...STAGE_ACTIONS[this.stage]];
      if (this.case.sex === 'female') ids = ids.filter(id => id !== 'foreskin');
      if (this.case.sex !== 'female') ids = ids.filter(id => id !== 'wrong_site');
      if (this.flags.sterile) ids = ids.filter(id => id !== 'replace_sterile');
      if (this.caseId !== 'female') ids = ids.filter(id => id !== 'latex_device');
    }
    return ids.map(id => ({ id, label: ACTIONS[id][0], kind: ACTIONS[id][1], done: this._doneFlag(id), disabled: this.paused }));
  }

  snapshot() {
    const f = this.flags;
    const assessment = [['identified', 'Identificar a la persona'], ['indication', 'Comprobar indicación y alternativas'], ['explained', 'Explicar el procedimiento'], ['consent', 'Obtener consentimiento'], ['allergies', 'Revisar alergias'], ['riskAssessed', 'Valorar antecedentes y signos de lesión']];
    const preparation = [['privacy', 'Preservar intimidad'], ['positioned', 'Posición cómoda'], ['preclean', 'Higiene perineal inicial'], ['handHygiene', 'Higiene de manos'], ['equipmentChecked', 'Revisar equipo y ficha'], ['deviceSelected', 'Seleccionar dispositivo compatible'], ['gloves', 'Guantes estériles'], ['drape', 'Campo estéril'], ['sterile', 'Mantener o restablecer esterilidad'], ['cleaned', 'Preparación del meato'], ['dry', 'Contacto y secado del producto'], ['lubricated', 'Lubricación adecuada'], ['closedSystem', 'Sistema cerrado']];
    let checks = [...assessment, ...preparation].map(([key, label]) => ({ met: !!f[key], label }));
    const referral = this.finished && this.outcome !== 'completed';
    if (referral) {
      const initial = this.caseId === 'trauma' ? assessment.filter(([key]) => ['identified', 'explained', 'riskAssessed'].includes(key)) : this.caseId === 'difficult' && this.stage >= 7 ? [...assessment, ...preparation] : assessment;
      checks = initial.map(([key, label]) => ({ met: !!f[key], label }));
      checks.push({ met: !!this.event?.stopped, label: 'Detener la maniobra' }, { met: !!this.event?.assessed, label: 'Valorar la incidencia' }, { met: !!this.event?.called, label: 'Solicitar ayuda y comunicar hallazgos' });
    } else {
      checks.push(
        { met: this.insertion >= 100, label: 'Completar avance sin forzar' },
        { met: !!f.urineObserved, label: 'Verificar retorno de orina' },
        { met: !!f.positionVerified && !!f.confirmed, label: 'Verificar zona del balón intravesical' },
        { met: !!f.balloonSpec && this.balloon === 1, label: 'Inflado conforme al fabricante' },
        { met: !!f.secured, label: 'Fijar sin tracción' },
        { met: !!f.bagBelow && !!f.bagPositionVerified, label: 'Comprobar colector bajo la vejiga' },
        { met: !!f.flowChecked, label: 'Revisar drenaje y acodamientos' },
        { met: this.case.sex === 'female' || !!f.foreskin, label: 'Verificar prepucio si corresponde' },
        { met: !!f.glovesRemoved && !!f.finalHygiene, label: 'Retirar guantes e higiene final' },
        { met: !!f.documented, label: 'Documentar procedimiento y plan' },
        { met: !!f.reassessed, label: 'Reevaluar tolerancia y necesidad' }
      );
    }
    const demonstrated = checks.filter(item => item.met).length;
    const coverage = Math.round(demonstrated / checks.length * 100);
    const missing = checks.filter(item => !item.met).map(item => item.label);
    const score = clamp(coverage - this.errors.reduce((sum, item) => sum + item.penalty, 0), 0, 100);
    const passed = this.finished && !this.criticalFailure && this.errors.length === 0 && missing.length === 0;
    const strengths = this.log.filter(item => item.severity === 'success').map(item => item.message);
    return copy({
      caseId: this.caseId, case: this.case, stage: this.stage, stageInfo: STAGES[this.stage], stageComplete: this.stageComplete,
      actions: this._actions(), completed: this.completed, skipped: this.skipped, flags: this.flags,
      insertion: this.insertion, placement: this.placement, balloon: this.balloon, drainage: this.drainage,
      bladder: Math.max(0, this.case.volume - this.drainage), pain: this.vitals.pain,
      ...this.vitals, vitals: this.vitals, elapsed: this.elapsed, dialogue: this.dialogue, dialogueId: this.dialogueId,
      log: this.log, errors: this.errors, score, coverage, demonstrated, applicableChecks: checks.length, criticalFailure: this.criticalFailure,
      event: this.event, injury: this.injury, bleeding: this.bleeding, infectionRisk: this.infectionRisk,
      paused: this.paused, finished: this.finished, outcome: this.outcome, lastAction: this.lastAction, note: this.note || '',
      debrief: {
        passed, criticalFailure: this.criticalFailure,
        summary: !this.finished ? 'La evaluación continúa.' : this.criticalFailure ? 'Se produjo un fallo crítico. La respuesta posterior queda registrada y no borra el evento.' : this.outcome === 'safe_referral' ? 'Se suspendió el intento y se solicitó valoración sin continuar la instrumentación.' : 'Se cerró la secuencia; revisa también las omisiones y decisiones registradas.',
        critical: this.errors.filter(item => item.critical).map(item => item.message),
        verdict: !this.finished ? 'En curso' : this.criticalFailure ? 'Fallo crítico de seguridad' : this.errors.length || missing.length ? 'Requiere revisar decisiones' : this.outcome === 'safe_referral' ? 'Suspensión y derivación seguras' : 'Secuencia segura completada',
        strengths, improvements: [...this.errors.map(item => item.message), ...missing.map(label => 'Sin demostrar: ' + label + '.')],
        demonstrated, applicableChecks: checks.length, coverage,
        note: 'Puntuación de un guion docente, no acreditación de competencia. Signos, dolor y tiempos ilustrativos; no equivalen a un modelo fisiológico validado.'
      }
    });
  }
}
