import { CASES, STAGES, Simulation } from './engine.js';
import { AnatomyScene } from './scene.js';
import { PatientVoice, MonitorTrace } from './clinical.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time = seconds => `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(Math.floor(seconds % 60)).padStart(2,'0')}`;
let simulation = new Simulation('male');
let started = false, guided = false, lastDialogue = null, lastActions = '', lastLog = '', lastStage = '', lastFinished = false, pendingCase = null;
let lastSnapshot = simulation.snapshot();
const voice = new PatientVoice({onStatus: status => {
  $('#voice-status').textContent = status.message;
  $('#voice-toggle').setAttribute('aria-pressed', String(status.enabled));
  $('#voice-toggle').textContent = status.enabled ? '◖)) Voz activa' : '◖ Voz silenciada';
  $('#patient-avatar').classList.toggle('speaking', !!status.speaking);
}});
const entryButton = $('#start-session');
entryButton.disabled = true;
entryButton.textContent = 'Preparando la voz…';
voice.ready.finally(() => {
  entryButton.disabled = false;
  entryButton.innerHTML = 'Entrar al caso con voz activa <span>→</span>';
});
const trace = new MonitorTrace($('#waveforms'));
let anatomy;
try {
  anatomy = new AnatomyScene($('#scene-3d'), {onSelect: item => {
    $('#structure-title').textContent = item.title;
    $('#structure-description').textContent = item.description;
    $('#structure-info').hidden = false;
  }});
  $('#scene-loading').hidden = true;
} catch (error) {
  $('#scene-loading').textContent = 'La vista 3D no está disponible en este dispositivo. Puedes completar las decisiones y escuchar al paciente.';
  console.error('No se pudo iniciar el visor 3D', error);
}

$('#case-select').innerHTML = CASES.map(c => `<option value="${esc(c.id)}">${esc(c.label || c.title)}</option>`).join('');

function notice(message, severity = 'info') {
  const node = $('#feedback');
  node.textContent = message;
  node.dataset.severity = severity;
  node.hidden = !message;
}
function showDialog(id) { const d = $(id); if (!d.open) d.showModal(); }
function showTab(name) {
  for (const key of ['log','debrief']) {
    $(`#tab-${key}`).setAttribute('aria-selected', String(key === name));
    $(`#tab-${key}`).tabIndex = key === name ? 0 : -1;
    $(`#panel-${key}`).hidden = key !== name;
  }
}
function safeFindings(findings) {
  if (!findings) return '';
  const items = Array.isArray(findings) ? findings : typeof findings === 'object' ? Object.values(findings) : [findings];
  return `<ul>${items.map(f => `<li>${esc(typeof f === 'object' ? JSON.stringify(f) : f)}</li>`).join('')}</ul>`;
}
function caseDetail(v) {
  $('#case-dialog-title').textContent = v.case.title;
  $('#case-dialog-history').textContent = v.case.history || v.case.brief;
  $('#case-findings').innerHTML = safeFindings(v.case.findings);
  showDialog('#case-dialog');
}
function refreshEntry(v) {
  $('#start-case-label').textContent = `${v.case.age} AÑOS · ${v.case.sex === 'female' ? 'PACIENTE FEMENINA' : 'PACIENTE MASCULINO'}`;
  $('#start-case-title').textContent = v.case.title;
  $('#start-case-brief').textContent = v.case.brief || v.case.history;
}
function resetCase(id) {
  voice.stop();
  simulation = new Simulation(id);
  started = false;
  lastDialogue = null; lastActions = ''; lastLog = ''; lastStage = ''; lastFinished = false;
  $('#case-select').value = id;
  $('#insertion-target').value = 0;
  $('#structure-info').hidden = true;
  notice('');
  showTab('log');
  anatomy?.resetView();
  render();
  refreshEntry(lastSnapshot);
  showDialog('#start-dialog');
}
function perform(action, payload = {}) {
  if (!started) { showDialog('#start-dialog'); return; }
  if (lastSnapshot.finished && !['pause'].includes(action)) return;
  if (lastSnapshot.paused && action !== 'pause') { notice('El caso está pausado. Reanuda al paciente para continuar.'); return; }
  const result = simulation.dispatch(action, payload);
  if (result?.message) notice(result.message, result.severity || (result.ok ? 'success' : 'warning'));
  render();
}
function renderActions(v) {
  const signature = JSON.stringify([v.stage, guided, v.finished, v.paused, v.actions]);
  if (signature === lastActions) return;
  lastActions = signature;
  const activeAction = document.activeElement?.closest('#action-list [data-action]')?.dataset.action;
  $('#action-list').innerHTML = (v.actions || []).map(a => {
    const done = !!a.done;
    const kind = guided && a.kind === 'danger' ? 'danger' : a.kind === 'primary' ? 'primary' : '';
    return `<button class="action-button ${kind} ${done ? 'done' : ''}" data-action="${esc(a.id)}" ${a.disabled || v.paused || v.finished ? 'disabled' : ''}><span class="action-marker" aria-hidden="true">${done ? '✓' : '○'}</span><span>${esc(a.label)}</span>${done ? '<small>Realizado</small>' : '<span class="action-arrow" aria-hidden="true">↗</span>'}</button>`;
  }).join('');
  if (activeAction) {
    const replacement = [...document.querySelectorAll('#action-list [data-action]')].find(button => button.dataset.action === activeAction);
    if (replacement && !replacement.disabled) replacement.focus({preventScroll:true});
    else $('#decision-panel').focus({preventScroll:true});
  }
}
function renderDebrief(v) {
  if (!v.finished) return;
  const d = v.debrief || {};
  const strings = x => !x ? [] : Array.isArray(x) ? x.map(a => typeof a === 'object' ? a.message || a.label || a.title || JSON.stringify(a) : a) : [String(x)];
  const strengths = strings(d.strengths || d.passed || []);
  const improvements = strings(d.improvements || d.recommendations || []);
  const errors = (v.errors || []).map(e => typeof e === 'object' ? e.message || e.label || e.id : e);
  const critical = strings(d.critical || []);
  const outcome = typeof v.outcome === 'string' ? v.outcome : v.outcome?.label || '';
  const outcomeLabel = {completed:'Procedimiento completado',safe_referral:'Suspensión y derivación',injury_referral:'Derivación tras incidente crítico'}[outcome] || 'Intento revisado';
  $('#debrief-content').innerHTML = `<div class="debrief-heading"><span class="eyebrow">CASO CERRADO · ${esc(time(v.elapsed))}</span><h2>${v.criticalFailure ? 'Incidente crítico durante el intento' : outcome === 'completed' ? 'Procedimiento completado' : 'Revisión de tu decisión clínica'}</h2><p>${esc(d.summary || (typeof v.outcome === 'object' ? v.outcome.message : '') || 'Revisa el proceso, la respuesta del paciente y los criterios de seguridad.')}</p></div><div class="debrief-grid"><article class="result-card"><span>CRITERIOS DEMOSTRADOS</span><strong class="metric">${Math.round(v.score ?? 0)}<small>/100</small></strong><p>Describe este intento; no certifica competencia clínica.</p></article><article class="result-card ${v.criticalFailure ? 'critical' : ''}"><span>SEGURIDAD</span><strong>${v.criticalFailure ? 'Fallo crítico' : 'Sin fallo crítico registrado'}</strong><p>${v.criticalFailure ? 'La puntuación no compensa un incidente de seguridad.' : 'La ausencia de incidentes no sustituye la revisión del procedimiento.'}</p></article></div>${critical.length ? `<h3>Incidentes críticos</h3><ul class="result-list">${critical.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}<h3>Decisiones y omisiones</h3><ul class="result-list">${(errors.length ? errors : ['No se registraron errores en las reglas implementadas.']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${strengths.length ? `<h3>Lo que hiciste bien</h3><ul class="result-list">${strengths.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}${improvements.length ? `<h3>Para el siguiente intento</h3><ul class="result-list">${improvements.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}<p class="muted">${esc(outcomeLabel)} · Respuestas programadas. Comenta el caso y sus límites con tu docente.</p><button class="primary-button" id="debrief-restart">Practicar otro intento →</button>`;
}
function render() {
  const v = simulation.snapshot(); lastSnapshot = v;
  const baseline = v.case.baseline || {};
  for (const [id,value] of [['v-hr',v.hr],['v-rr',v.rr],['v-pain',v.pain]]) $("#"+id).textContent = Math.round(value ?? 0);
  $('#v-bp').textContent = `${Math.round(v.sys ?? 0)}/${Math.round(v.dia ?? 0)}`;
  $('#elapsed').textContent = time(v.elapsed || 0);
  const trend = (value,base,unit) => { const d = Math.round((value || 0) - (base || 0)); return Math.abs(d) < 1 ? 'Sin cambio respecto al ingreso' : `${d > 0 ? '↑' : '↓'} ${Math.abs(d)} ${unit} desde el ingreso`; };
  $('#trend-hr').textContent = trend(v.hr,baseline.hr,'lpm');
  $('#trend-rr').textContent = trend(v.rr,baseline.rr,'rpm');
  $('#trend-bp').textContent = trend(v.sys,baseline.sys,'mmHg sistólica');
  $('#trend-pain').textContent = trend(v.pain,baseline.pain,'puntos');
  $('#monitor-status').textContent = !started ? 'Paciente en espera de valoración' : v.paused ? 'Evolución pausada' : v.finished ? 'Caso cerrado · revisar el intento' : v.event ? v.event.label : 'Observa tendencias y escucha al paciente';
  $('.monitor').dataset.severity = v.event?.severity || '';
  $('#pause-session').setAttribute('aria-pressed',String(v.paused));
  $('#pause-session').setAttribute('aria-label',v.paused ? 'Reanudar paciente' : 'Pausar paciente');
  $('#pause-session').textContent = v.paused ? '▶' : 'Ⅱ';
  $('#pause-session').disabled = !started || v.finished;
  $('#case-name').textContent = `${v.case.age} años · ${v.case.sex === 'female' ? 'Mujer' : 'Hombre'}`;
  $('#case-summary').textContent = v.case.title;
  $('#patient-name').textContent = `${v.case.sex === 'female' ? 'PACIENTE' : 'PACIENTE'} · ${v.case.age} AÑOS`;
  $('#patient-dialogue').textContent = `«${v.dialogue || 'Estoy esperando que me atiendan.'}»`;
  if (started && v.dialogueId !== lastDialogue) {
    voice.say(v.dialogue, {id:v.dialogueId, urgent:!!v.event, sex:v.case.sex});
    lastDialogue = v.dialogueId;
  }
  const stageKey = `${v.stage}-${v.caseId}`;
  if (stageKey !== lastStage) {
    lastStage = stageKey;
    $('#step-title').textContent = v.stageInfo?.title || STAGES[v.stage]?.title || 'Decisión clínica';
    $('#step-description').textContent = v.stageInfo?.description || STAGES[v.stage]?.description || '';
  }
  $('#step-counter').textContent = `${String(v.stage+1).padStart(2,'0')} / 12`;
  $('#step-progress-fill').style.width = `${((v.completed?.length || 0)/12)*100}%`;
  $('#guide-note').hidden = !guided;
  $('#guide-text').textContent = v.stageInfo?.guidance || v.stageInfo?.description || 'Valora los hallazgos, comprueba las condiciones de seguridad y vuelve a escuchar al paciente.';
  $('#event-banner').hidden = !v.event;
  if (v.event) { $('#event-title').textContent=v.event.label; $('#event-description').textContent=v.event.message; $('#event-banner').dataset.severity=v.event.severity; }
  $('#insertion-control').hidden = v.stage !== 7 || v.finished;
  const slider = $('#insertion-target');
  if (document.activeElement !== slider) slider.value = Math.round(v.insertion || 0);
  slider.disabled = v.paused || v.finished || !!v.event;
  $('#insertion-output').textContent = `${Math.round(v.insertion || 0)} %`;
  $('#next-step').disabled = !v.stageComplete || v.paused || v.finished || v.stage >= 11;
  $('#next-step').hidden = v.finished || v.stage >= 11;
  $('#trigger-vagal').disabled = !started || v.paused || v.finished || v.stage < 7 || !!v.event;
  $('#decision-note').textContent = v.finished ? 'Caso cerrado. Consulta la reflexión y exporta tu registro.' : guided ? 'La guía explica el objetivo de la etapa; las decisiones siguen siendo tuyas.' : 'El caso responde a tus decisiones. La revisión aparece al finalizar.';
  renderActions(v);
  for (const button of document.querySelectorAll('[data-global]')) button.disabled = !started || v.paused || v.finished;
  $('#drainage-volume').textContent = Math.round(v.drainage || 0);
  $('#fluid-fill').style.width = `${Math.min(100,(v.drainage || 0)/(v.case.volume || 900)*100)}%`;
  const flow = v.drainage > 0 && !v.event && !v.paused;
  $('#drainage-status').textContent = (v.stage >= 10 && !v.flags?.bagBelow) ? 'Revisa la posición del colector' : flow ? 'Retorno de orina en el caso simulado' : v.event ? 'Revalora el sistema y al paciente' : 'Sin retorno observado';
  $('#drainage-detail').textContent = v.infectionRisk ? 'Se registró un riesgo diferido por pérdida de asepsia.' : 'Volumen y evolución programados; no equivalen a diuresis horaria.';
  $('#timeline').innerHTML = STAGES.map((s,i)=>`<li class="timeline-item ${i===v.stage?'current':''} ${v.completed?.includes(i)?'done':''} ${v.skipped?.includes(i)?'skipped':''}"><span class="timeline-number">${v.skipped?.includes(i)?'!':v.completed?.includes(i)?'✓':String(i+1).padStart(2,'0')}</span><span>${esc(s.short || s.title)}</span>${i===v.stage?`<small>${v.finished?'CIERRE DEL INTENTO':'EN CURSO'}</small>`:''}</li>`).join('');
  const logSignature = `${v.log?.length}-${v.log?.at(-1)?.id}-${v.caseId}`;
  if (logSignature !== lastLog) {
    lastLog = logSignature;
    $('#log-count').textContent = v.log?.length || 0;
    $('#clinical-log').innerHTML = (v.log || []).slice().reverse().map(e=>`<li class="log-entry" data-severity="${esc(e.severity)}"><time class="log-time">${esc(time(e.time))}</time><span class="log-message">${esc(e.message)}</span></li>`).join('') || '<li class="log-empty">El registro comenzará con tu primera decisión.</li>';
  }
  const injury = !!(v.injury || v.bleeding);
  anatomy?.update({sex:v.case.sex, scenario:v.caseId, insertion:v.insertion || 0, balloon:!!v.balloon, drainage:v.drainage || 0, injury, placement:v.placement, stage:v.stage, paused:!started || v.paused || v.finished});
  trace.update({...v,paused:!started || v.paused || v.finished});
  if (v.finished && !lastFinished) { renderDebrief(v); showTab('debrief'); }
  lastFinished = !!v.finished;
}

$('#action-list').addEventListener('click', event => { const button=event.target.closest('[data-action]'); if (button) perform(button.dataset.action); });
$('.communication-actions').addEventListener('click', event => { const button=event.target.closest('[data-global]'); if (button) perform(button.dataset.global); });
$('#trigger-vagal').addEventListener('click',()=>{if(simulation.triggerIncident('vagal')){notice('Se introdujo una incidencia docente. Observa y responde al paciente.','warning');render();}});
$('#next-step').addEventListener('click', () => { perform('next'); notice(''); });
$('#insertion-target').addEventListener('change', event => perform('advance',{value:Number(event.target.value)}));
$('#pause-session').addEventListener('click', () => { perform('pause'); if(lastSnapshot.paused) voice.pause(); else voice.resume(); });
$('#voice-toggle').addEventListener('click', () => { const enabled = $('#voice-toggle').getAttribute('aria-pressed') !== 'true'; voice.setEnabled(enabled); if(enabled && started) {voice.activate(lastSnapshot.dialogue,lastSnapshot.case.sex); lastDialogue=lastSnapshot.dialogueId;} });
$('#start-session').addEventListener('click', () => { started=true; $('#start-dialog').close(); voice.activate(lastSnapshot.dialogue,lastSnapshot.case.sex); lastDialogue=lastSnapshot.dialogueId; render(); });
$('#start-dialog').addEventListener('cancel', e=>e.preventDefault());
for (const id of ['mode-evaluation','mode-guided']) $("#"+id).addEventListener('click',()=>{ guided=id==='mode-guided'; $('#mode-evaluation').setAttribute('aria-pressed',String(!guided)); $('#mode-guided').setAttribute('aria-pressed',String(guided)); render(); });
for (const button of document.querySelectorAll('[data-layer]')) button.addEventListener('click',()=>{ anatomy?.setLayer(button.dataset.layer); for(const b of document.querySelectorAll('[data-layer]')) b.setAttribute('aria-pressed',String(b===button)); });
for (const button of document.querySelectorAll('[data-view]')) button.addEventListener('click',()=>anatomy?.setView(button.dataset.view));
$('#structure-close').addEventListener('click',()=>$('#structure-info').hidden=true);
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement) await document.exitFullscreen(); else await $('.scene-card').requestFullscreen();}catch{notice('La pantalla completa no está disponible en este navegador.');}});
$('#case-detail-open').addEventListener('click',()=>caseDetail(lastSnapshot));
$('#case-select').addEventListener('change',event=>{pendingCase=event.target.value; event.target.value=lastSnapshot.caseId; if(!started || lastSnapshot.finished) resetCase(pendingCase); else showDialog('#confirm-dialog');});
$('#reset-session').addEventListener('click',()=>{pendingCase=lastSnapshot.caseId;showDialog('#confirm-dialog');});
$('#confirm-cancel').addEventListener('click',()=>{$('#confirm-dialog').close();pendingCase=null;});
$('#confirm-restart').addEventListener('click',()=>{$('#confirm-dialog').close();resetCase(pendingCase || lastSnapshot.caseId);pendingCase=null;});
$('#debrief-content').addEventListener('click',event=>{if(event.target.closest('#debrief-restart'))resetCase(lastSnapshot.caseId);});
for(const id of ['methodology-open','sources-open']) $("#"+id).addEventListener('click',()=>showDialog('#methodology-dialog'));
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$("#"+b.dataset.close).close());
for(const name of ['log','debrief']) $(`#tab-${name}`).addEventListener('click',()=>showTab(name));
$('.review-tabs').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const name=$('#tab-log').getAttribute('aria-selected')==='true'?'debrief':'log';showTab(name);$(`#tab-${name}`).focus();}});
$('#export-log').addEventListener('click',()=>{
  const v=lastSnapshot;
  const record={application:'VÉSICA · prototipo educativo',caseId:v.caseId,caseTitle:v.case.title,elapsed:v.elapsed,finished:v.finished,score:v.score,criticalFailure:v.criticalFailure,outcome:v.outcome,errors:v.errors,log:v.log,debrief:v.debrief,limitations:'Guion docente sin validación clínica. No contiene datos de pacientes reales.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`vesica-${v.caseId}-intento.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden && started && !lastSnapshot.paused && !lastSnapshot.finished){simulation.dispatch('pause');voice.pause();render();}});
window.addEventListener('pagehide',()=>{voice.dispose();trace.dispose();anatomy?.dispose();});
let previous=performance.now(),paint=0;
function frame(now){const dt=Math.min(.25,(now-previous)/1000);previous=now;if(started&&!lastSnapshot.finished)simulation.tick(dt);if(now-paint>=160){render();paint=now;}requestAnimationFrame(frame);}
render();refreshEntry(lastSnapshot);showTab('log');showDialog('#start-dialog');requestAnimationFrame(frame);
export function readSimulation(){return simulation.snapshot();}
