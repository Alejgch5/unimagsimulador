'use strict';
// Scripted educational responses, not a validated physiological model.
const clinical = {
  elapsed:0, target:0, paused:false, voice:false, event:null, stopped:false, assessed:false, called:false,
  reassured:false, drainage:0, initial:900, hr:104, rr:22, sys:154, dia:88, pain:8,
  log:[], lastMessage:'', lastPaint:0, frame:0, announced:new Set()
};
const clinicalDefaults={male:{hr:104,rr:22,sys:154,dia:88,pain:8,volume:900},female:{hr:96,rr:20,sys:142,dia:84,pain:6,volume:650},trauma:{hr:108,rr:24,sys:118,dia:76,pain:7,volume:0}};
const incidentLabels={resistance:'Resistencia durante el avance',vagal:'Mareo y respuesta vagal',obstruction:'Acodamiento del tubo de drenaje',contamination:'Material contaminado'};
function recordClinical(message){clinical.log.push({time:Math.floor(clinical.elapsed),message});if(clinical.log.length>80)clinical.log.shift();$('#clinical-log').innerHTML=clinical.log.map(e=>'<li><time>'+String(Math.floor(e.time/60)).padStart(2,'0')+':'+String(e.time%60).padStart(2,'0')+'</time> '+esc(e.message)+'</li>').reverse().join('');}
function sayClinical(message){if(clinical.lastMessage===message)return;clinical.lastMessage=message;$('#patient-voice').textContent=message;if(clinical.voice&&'speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(message);u.lang='es-CO';u.rate=.9;window.speechSynthesis.speak(u);}}
function resetClinical(){const d=clinicalDefaults[state.scenario];Object.assign(clinical,{elapsed:0,target:0,paused:false,event:null,stopped:false,assessed:false,called:false,reassured:false,drainage:0,initial:d.volume,hr:d.hr,rr:d.rr,sys:d.sys,dia:d.dia,pain:d.pain,log:[],lastMessage:'',announced:new Set()});window.speechSynthesis?.cancel();$('#clinical-pause').textContent='Pausar paciente';$('#clinical-pause').setAttribute('aria-pressed','false');recordClinical('Inicio del caso. Valores y evolución programados para docencia.');updateClinical(0);}
function obstructed(){return clinical.event==='obstruction'||(state.step>=10&&state.bag<65);}
function clinicalFlow(){return state.scenario!=='trauma'&&state.insertion>=82&&!obstructed()&&!clinical.event&&!clinical.paused&&!paused;}
function updateClinical(dt){if(clinical.paused||paused||document.hidden)dt=0;clinical.elapsed+=dt;
if(dt>0&&state.step===7&&!clinical.event&&!busy&&clinical.target>state.insertion){baseAdvance(Math.min(clinical.target,state.insertion+dt*8));const slider=$('#advance');if(slider)slider.value=state.insertion;}
const d=clinicalDefaults[state.scenario];if(clinicalFlow())clinical.drainage=Math.min(clinical.initial-40,clinical.drainage+dt*12);
const relief=clinical.initial?clinical.drainage/(clinical.initial-40):0;
let pain=Math.max(2,d.pain-relief*(d.pain-2));if(clinical.reassured)pain=Math.max(2,pain-.5);if(state.step===7&&state.insertion>0&&state.insertion<82)pain=Math.min(8,pain+1);
let hr=d.hr-relief*(d.hr-78)-(clinical.reassured?3:0),rr=d.rr-relief*(d.rr-16),sys=d.sys-relief*(d.sys-126),dia=d.dia-relief*(d.dia-78);
if(clinical.event==='resistance'){pain=clinical.stopped?7:9;hr=clinical.stopped?104:116;rr=clinical.stopped?22:26;sys=164;dia=94;}
if(clinical.event==='vagal'){hr=48;rr=18;sys=86;dia=52;pain=5;}
if(clinical.event==='obstruction'){pain=Math.max(5,pain);hr=Math.max(100,hr);}
const a=dt===0?0:1-Math.exp(-dt/2);for(const [key,target] of Object.entries({hr,rr,sys,dia,pain}))clinical[key]+=(target-clinical[key])*a;
$('#v-hr').textContent=Math.round(clinical.hr);$('#v-rr').textContent=Math.round(clinical.rr);$('#v-bp').textContent=Math.round(clinical.sys)+'/'+Math.round(clinical.dia);$('#v-pain').textContent=Math.round(clinical.pain)+'/10';$('#v-drain').textContent=Math.round(clinical.drainage);$('#v-bladder').textContent=state.scenario==='trauma'?'Sin estimar':Math.round(clinical.initial-clinical.drainage)+' mL';
$('#clinical-clock').textContent=String(Math.floor(clinical.elapsed/60)).padStart(2,'0')+':'+String(Math.floor(clinical.elapsed)%60).padStart(2,'0');
$('#patient-status').textContent=clinical.event?incidentLabels[clinical.event]:relief>.75?'Alivio progresivo del globo vesical':state.scenario==='trauma'?'Sospecha de lesión uretral':'Retención urinaria · valoración continua';
$('#patient-status').classList.toggle('incident',!!clinical.event);$('#clinical-monitor').classList.toggle('incident',!!clinical.event);$('#clinical-monitor').classList.toggle('frozen',clinical.paused||paused);
$('#clinical-alert').hidden=!clinical.event;
$('#clinical-alert-text').textContent=clinical.event?({resistance:'El maniquí comunica dolor y el avance está bloqueado. Detén la maniobra, valora y solicita ayuda; no fuerces.',vagal:'El guion muestra bradicardia e hipotensión. Detén la maniobra, valora al paciente y solicita ayuda inmediata.',obstruction:'El flujo está interrumpido. Inspecciona el tubo y la posición del colector sin desconectar el sistema.',contamination:'Se perdió la esterilidad. Sustituye el material contaminado antes de continuar.'}[clinical.event]):'';
let message=state.scenario==='trauma'?'Me duele desde el accidente.':relief>.75?'La presión está disminuyendo. Me siento más aliviado.':state.insertion>=82?'Siento que empieza a disminuir la presión.':state.step===7?'Siento molestia; avance con suavidad.':clinical.reassured?'Gracias por explicarme. Voy a intentar relajarme.':'Tengo presión y dolor en la parte baja del abdomen.';
if(clinical.event)message={resistance:clinical.stopped?'Gracias por detenerse. Todavía me duele.':'¡Me duele! Siento mucha molestia.',vagal:'Me estoy mareando… me siento débil.',obstruction:'Sigo sintiendo presión.',contamination:'La práctica se pausa para recuperar la esterilidad.'}[clinical.event];sayClinical(message);
$('#drainage-state').textContent=clinical.paused||paused?'Evolución pausada':clinical.event?'Flujo detenido en este guion':state.insertion<82?'Esperando acceso a la vejiga':obstructed()?'Revisar altura del colector':relief>=1?'Drenaje del caso completado':'Drenaje visible · tiempo abreviado';
$('#reservoir-fill').style.height=(clinical.initial?Math.max(0,(1-relief)*86):0)+'%';$('#collector-fill').style.height=(relief*86)+'%';$('#fluid-connection').classList.toggle('flowing',clinicalFlow()&&relief<1);
$('#breathing-view').style.setProperty('--breath-period',(60/clinical.rr)+'s');$('#breathing-view').classList.toggle('frozen',clinical.paused||paused);
for(const e of document.querySelectorAll('[data-incident]')){const id=e.dataset.incident;e.disabled=busy||clinical.paused||!!clinical.event||state.scenario==='trauma'||(id==='resistance'&&(state.step!==7||state.insertion>=82))||(id==='vagal'&&state.step<7)||(id==='obstruction'&&state.insertion<82)||(id==='contamination'&&(state.step<4||state.step>6));}
$('#clinical-resume').disabled=!clinical.event||!clinical.assessed||((clinical.event==='resistance'||clinical.event==='vagal')&&(!clinical.stopped||!clinical.called));
if(clinical.event||clinical.paused){const slider=$('#advance');if(slider)slider.disabled=true;$('#next').disabled=true;}
if(state.recorded&&!clinical.announced.has('end')){clinical.announced.add('end');recordClinical('Registro completado. Volumen drenado simulado: '+Math.round(clinical.drainage)+' mL. Dolor: '+Math.round(clinical.pain)+'/10.');}
if(state.insertion>=82&&!clinical.announced.has('urine')){clinical.announced.add('urine');recordClinical('Primer retorno de orina observado; falta confirmar la posición completa del balón.');}
if(state.confirmed&&!clinical.announced.has('confirmed')){clinical.announced.add('confirmed');recordClinical('Posición intravesical comprobada antes del inflado.');}
if(state.balloon&&!clinical.announced.has('balloon')){clinical.announced.add('balloon');recordClinical('Balón inflado después de confirmar la posición.');}
$('#clinical-summary').hidden=!state.recorded&&state.traumaStep!==3;
$('#summary-text').textContent=state.scenario==='trauma'?'Maniobra suspendida y valoración especializada solicitada.':state.done.length+' etapas · '+Math.round(clinical.drainage)+' mL drenados (guion) · dolor '+Math.round(clinical.pain)+'/10. Revisa la secuencia de decisiones en el registro.';
}
function setIncident(id){if(!incidentLabels[id]||clinical.event||busy||clinical.paused||state.scenario==='trauma')return false;
if(id==='resistance'&&(state.step!==7||state.insertion>=82))return false;if(id==='vagal'&&state.step<7)return false;if(id==='obstruction'&&state.insertion<82)return false;if(id==='contamination'&&(state.step<4||state.step>6))return false;
clinical.target=state.insertion;clinical.event=id;clinical.stopped=false;clinical.assessed=false;clinical.called=false;recordClinical('Docente activa: '+incidentLabels[id]+'.');updateClinical(0);return true;}
function handleClinical(action){if(action==='reassure'){clinical.reassured=true;recordClinical('Se explica el procedimiento y se acompaña al paciente.');}
if(action==='stop'){clinical.stopped=true;if(busy&&!paused)$('#pause').click();recordClinical('Maniobra detenida.');}
if(action==='assess'){clinical.assessed=true;recordClinical('Valoración del maniquí y revisión del monitor, dolor, sonda y drenaje.');}
if(action==='call'){clinical.called=true;recordClinical('Solicitud de ayuda: comunicar situación, antecedentes, evaluación y recomendación.');}
if(action==='resume'&&clinical.event){if(!clinical.assessed||(['resistance','vagal'].includes(clinical.event)&&(!clinical.stopped||!clinical.called)))return;
const old=clinical.event;clinical.event=null;recordClinical(old==='obstruction'?'Acodamiento corregido y colector revisado en el guion.':old==='contamination'?'Material contaminado sustituido en el guion.':'Docente finaliza la incidencia y autoriza continuar el caso simulado.');if(old==='obstruction')state.bag=75;render();}
updateClinical(0);}
function traceMonitor(){const canvas=$('#waveforms'),ctx=canvas.getContext('2d');if(!ctx)return;const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#173d46';ctx.lineWidth=1;for(let x=0;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
for(let row=0;row<2;row++){ctx.beginPath();ctx.strokeStyle=row?'#69cafa':'#63e2a5';ctx.lineWidth=2;for(let x=0;x<w;x++){const t=clinical.elapsed-(w-x)/85;let v;if(row)v=Math.sin(t*clinical.rr/60*Math.PI*2)*15;else{const phase=((t*clinical.hr/60)%1+1)%1;v=5*Math.exp(-Math.pow((phase-.16)/.04,2))-9*Math.exp(-Math.pow((phase-.36)/.017,2))+38*Math.exp(-Math.pow((phase-.40)/.015,2))-15*Math.exp(-Math.pow((phase-.44)/.022,2))+8*Math.exp(-Math.pow((phase-.65)/.08,2));}const y=(row?106:47)-v;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();} }
const baseReset=reset;reset=function(scenario=state.scenario){baseReset(scenario);resetClinical();};
const baseAdvance=advance;advance=function(value){const n=Number(value);if(clinical.event||clinical.paused||busy||state.step!==7||done()||!Number.isFinite(n)||n<state.insertion||n>100)return false;clinical.target=n;return true;};
const baseNavigate=navigate;navigate=function(n){if(clinical.event||clinical.paused)return false;return baseNavigate(n);};
const baseMaterial=useMaterial;useMaterial=async function(id){if(clinical.event||clinical.paused){feedback('Atiende la incidencia o reanuda el paciente antes de continuar.',true);return false;}return baseMaterial(id);};
const baseAction=mainAction;mainAction=async function(){if(clinical.event||clinical.paused)return;return baseAction();};
const baseReplay=replay;replay=async function(){if(clinical.event||clinical.paused)return;return baseReplay();};
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-incident]');if(trigger)setIncident(trigger.dataset.incident);const action=e.target.closest('[data-clinical]');if(action)handleClinical(action.dataset.clinical);});
$('#clinical-pause').onclick=()=>{clinical.paused=!clinical.paused;if(busy&&clinical.paused&&!paused)$('#pause').click();$('#clinical-pause').textContent=clinical.paused?'Reanudar paciente':'Pausar paciente';$('#clinical-pause').setAttribute('aria-pressed',String(clinical.paused));if(!clinical.paused){if(busy&&paused)$('#pause').click();renderGuide();}updateClinical(0);};
$('#patient-audio').onclick=()=>{clinical.voice=!clinical.voice;$('#patient-audio').textContent=clinical.voice?'Voz activada':'Activar voz';$('#patient-audio').setAttribute('aria-pressed',String(clinical.voice));if(clinical.voice){const message=clinical.lastMessage;clinical.lastMessage='';sayClinical(message);}else window.speechSynthesis?.cancel();};
if(!('speechSynthesis' in window)){$('#patient-audio').disabled=true;$('#patient-audio').textContent='Voz no disponible';}
$('#clinical-camera').onclick=()=>{const expanded=$('#breathing-view').classList.toggle('expanded');$('#clinical-camera').textContent=expanded?'Reducir vista del maniquí':'Ampliar vista del maniquí';};
$('#stop').addEventListener('click',()=>handleClinical('stop'));
resetClinical();let lastClinical=null;function clinicalFrame(now){const dt=lastClinical===null?0:Math.min((now-lastClinical)/1000,.1);lastClinical=now;updateClinical(dt);traceMonitor();requestAnimationFrame(clinicalFrame);}requestAnimationFrame(clinicalFrame);
