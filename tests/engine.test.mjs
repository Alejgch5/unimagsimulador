import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, Simulation } from '../engine.js';

const prep = [
  ['identify', 'indication', 'explain', 'consent', 'allergies', 'assess_risk'],
  ['privacy', 'position', 'preclean'], ['hand_hygiene'], ['check_equipment', 'choose_device'],
  ['sterile_gloves', 'drape'], ['clean', 'wait_dry'], ['lubricant', 'closed_system']
];
function prepared(caseId = 'male') {
  const sim = new Simulation(caseId);
  for (const actions of prep) {
    for (const action of actions) assert.equal(sim.dispatch(action).ok, true, action);
    assert.equal(sim.dispatch('next').ok, true);
  }
  assert.equal(sim.stage, 7);
  return sim;
}
function intravesical(caseId = 'male') {
  const sim = prepared(caseId);
  assert.equal(sim.dispatch('advance', { value: 100 }).ok, true);
  sim.dispatch('next');
  for (const action of ['observe_urine', 'verify_position', 'confirm']) assert.equal(sim.dispatch(action).ok, true);
  sim.dispatch('next');
  return sim;
}
function finish(sim) {
  sim.dispatch('check_balloon_spec');
  assert.equal(sim.dispatch('inflate').ok, true);
  sim.dispatch('next');
  for (const action of ['secure', 'bag_below', 'check_flow']) sim.dispatch(action);
  if (sim.case.sex !== 'female') sim.dispatch('foreskin');
  sim.dispatch('next');
  for (let i = 0; i < 40; i++) sim.tick(1);
  for (const action of ['remove_gloves', 'final_hygiene', 'document', 'reassess', 'finish']) assert.equal(sim.dispatch(action).ok, true, action);
}

test('all four cases start with audible dialogue state and declared illustrative baselines', () => {
  assert.equal(CASES.length, 4);
  for (const scenario of CASES) {
    const s = new Simulation(scenario.id).snapshot();
    assert.ok(s.dialogue.length > 20);
    assert.equal(s.dialogueId, 1);
    assert.equal(s.hr, scenario.baseline.hr);
    assert.equal(s.stage, 0);
  }
  assert.throws(() => new Simulation('unknown'), RangeError);
});

for (const caseId of ['male', 'female']) test(`${caseId}: complete safe sequence produces debrief without errors`, () => {
  const sim = intravesical(caseId);
  finish(sim);
  const s = sim.snapshot();
  assert.equal(s.finished, true);
  assert.equal(s.outcome, 'completed');
  assert.equal(s.errors.length, 0);
  assert.equal(s.score, 100);
  assert.equal(s.criticalFailure, false);
  assert.equal(s.debrief.passed, true);
  assert.equal(s.completed.length, 12);
  assert.ok(s.drainage > 0);
  assert.ok(s.pain < s.case.baseline.pain);
  assert.ok(s.hr < s.case.baseline.hr);
});

test('trauma safe route ends without blind instrumentation', () => {
  const sim = new Simulation('trauma');
  sim.dispatch('assess_risk');
  sim.dispatch('defer');
  sim.dispatch('assess');
  sim.dispatch('call_help');
  assert.equal(sim.finished, true);
  assert.equal(sim.outcome, 'safe_referral');
  assert.equal(sim.insertion, 0);
  assert.equal(sim.criticalFailure, false);
});

test('instrumenting trauma causes critical failure and blocks more insertion', () => {
  const sim = prepared('trauma');
  sim.dispatch('advance', { value: 10 });
  assert.equal(sim.criticalFailure, true);
  assert.equal(sim.bleeding, true);
  assert.equal(sim.dispatch('next').ok, false);
  const depth = sim.insertion;
  assert.equal(sim.dispatch('advance', { value: 100 }).ok, false);
  assert.equal(sim.insertion, depth);
  sim.dispatch('stop'); sim.dispatch('assess'); sim.dispatch('call_help');
  assert.equal(sim.outcome, 'injury_referral');
});

test('resistance can be stopped and referred without imposing injury', () => {
  const sim = prepared('difficult');
  sim.dispatch('advance', { value: 80 });
  assert.equal(sim.insertion, 55);
  assert.equal(sim.event.id, 'resistance');
  assert.equal(sim.criticalFailure, false);
  assert.equal(sim.bleeding, false);
  assert.equal(sim.dispatch('resume').ok, false);
  sim.dispatch('stop'); sim.dispatch('assess'); sim.dispatch('call_help');
  assert.equal(sim.finished, true);
  assert.equal(sim.outcome, 'safe_referral');
});

test('forcing resistance injures and reassurance cannot cure or erase it', () => {
  const sim = prepared('difficult');
  sim.dispatch('advance', { value: 80 });
  sim.dispatch('force');
  const errors = sim.errors.length;
  sim.dispatch('explain');
  for (let i = 0; i < 12; i++) sim.tick(1);
  assert.equal(sim.criticalFailure, true);
  assert.equal(sim.injury, 'forced_resistance');
  assert.equal(sim.bleeding, true);
  assert.ok(sim.vitals.pain > 8);
  assert.equal(sim.dispatch('resume').ok, false);
  assert.equal(sim.errors.length, errors);
  sim.dispatch('stop'); sim.dispatch('assess'); sim.dispatch('call_help');
  assert.equal(sim.snapshot().debrief.critical.length, 1);
});

test('urethral balloon inflating triggers pain and requires deflation before closure', () => {
  const sim = prepared();
  sim.dispatch('advance', { value: 40 });
  sim.dispatch('premature_balloon');
  assert.equal(sim.injury, 'urethral_balloon');
  assert.ok(sim.balloon > 0);
  assert.ok(sim.snapshot().actions.some(action => action.id === 'deflate'));
  sim.dispatch('stop'); sim.dispatch('assess'); sim.dispatch('call_help');
  assert.equal(sim.finished, false);
  sim.dispatch('deflate');
  assert.equal(sim.balloon, 0);
  assert.equal(sim.finished, true);
  assert.equal(sim.criticalFailure, true);
});

test('visible intravesical position does not excuse omitted verification', () => {
  const sim = prepared();
  sim.dispatch('advance', { value: 100 });
  sim.dispatch('next');
  sim.dispatch('premature_balloon');
  assert.equal(sim.criticalFailure, true);
  assert.equal(sim.injury, null);
  assert.equal(sim.bleeding, false);
  assert.equal(sim.dispatch('confirm').ok, false);
});

test('manufacturer volume is enforced without inventing injury for underfill', () => {
  const over = intravesical();
  over.dispatch('excessive_volume');
  assert.equal(over.injury, 'balloon_overfill');
  const under = intravesical();
  under.dispatch('inflate', { volume: 3 });
  assert.equal(under.event.id, 'balloon_volume');
  assert.equal(under.criticalFailure, false);
  assert.equal(under.injury, null);
});

test('contamination creates a delayed infection risk without immediate vital deterioration', () => {
  const sim = new Simulation();
  for (let stage = 0; stage < 4; stage++) {
    for (const action of prep[stage]) sim.dispatch(action);
    sim.dispatch('next');
  }
  sim.dispatch('sterile_gloves'); sim.dispatch('drape');
  const control = new Simulation();
  control.flags.explained = true;
  sim.dispatch('touch_nonsterile');
  sim.dispatch('touch_nonsterile');
  assert.equal(sim.errors.filter(item => item.id === 'sterility_breach').length, 1);
  assert.equal(sim.infectionRisk, true);
  assert.equal(sim.stageComplete, false);
  for (let i = 0; i < 60; i++) { sim.tick(1); control.tick(1); }
  assert.deepEqual(sim.vitals, control.vitals);
  assert.equal(sim.injury, null);
  sim.dispatch('replace_sterile');
  assert.equal(sim.flags.sterile, true);
  assert.equal(sim.infectionRisk, false);
  assert.equal(sim.stageComplete, true);
});

test('latex selection is intercepted as an error without invented anaphylaxis', () => {
  const sim = new Simulation('female');
  for (let stage = 0; stage < 3; stage++) {
    for (const action of prep[stage]) sim.dispatch(action);
    sim.dispatch('next');
  }
  const before = { ...sim.vitals };
  sim.dispatch('latex_device');
  assert.equal(sim.flags.deviceSelected, undefined);
  assert.equal(sim.injury, null);
  assert.equal(sim.criticalFailure, false);
  assert.deepEqual(sim.vitals, before);
  sim.dispatch('check_equipment'); sim.dispatch('choose_device');
  assert.equal(sim.stageComplete, true);
});

test('flow requires an intact closed system and bag below the bladder', () => {
  const sim = intravesical();
  sim.dispatch('check_balloon_spec'); sim.dispatch('inflate'); sim.dispatch('next');
  sim.tick(5);
  assert.ok(sim.drainage > 0);
  const volume = sim.drainage;
  sim.dispatch('lift_bag'); sim.tick(5);
  assert.equal(sim.drainage, volume);
  sim.dispatch('bag_below'); sim.dispatch('disconnect'); sim.tick(5);
  assert.equal(sim.drainage, volume);
  assert.equal(sim.infectionRisk, true);
});

test('vagal event is explicitly triggered and distinct from forced injury', () => {
  const sim = prepared();
  assert.equal(sim.triggerIncident('vagal'), true);
  for (let i = 0; i < 20; i++) sim.tick(1);
  assert.ok(sim.vitals.hr < 55);
  assert.ok(sim.vitals.sys < 95);
  assert.equal(sim.injury, null);
  assert.equal(sim.criticalFailure, false);
  sim.dispatch('stop'); sim.dispatch('assess'); sim.dispatch('call_help');
  assert.equal(sim.outcome, 'safe_referral');
});

test('pause freezes the clock and symptoms and prevents procedural actions', () => {
  const sim = prepared();
  sim.dispatch('pause');
  const before = sim.snapshot();
  sim.tick(5);
  assert.equal(sim.elapsed, before.elapsed);
  assert.deepEqual(sim.vitals, before.vitals);
  assert.equal(sim.dispatch('advance').ok, false);
  assert.equal(sim.insertion, 0);
  sim.dispatch('pause');
  assert.equal(sim.dispatch('advance').ok, true);
});

test('invalid or out-of-stage actions cannot mutate clinical state', () => {
  const sim = new Simulation();
  assert.equal(sim.dispatch('inflate').ok, false);
  assert.equal(sim.dispatch('advance', { value: 100 }).ok, false);
  assert.equal(sim.dispatch('next').ok, false);
  assert.equal(sim.stage, 0);
  assert.equal(sim.balloon, 0);
  assert.equal(sim.insertion, 0);
  sim.tick(NaN); sim.tick(-3);
  assert.equal(sim.elapsed, 0);
});

test('snapshot is detached from mutable scenario state', () => {
  const sim = new Simulation();
  const snapshot = sim.snapshot();
  snapshot.flags.consent = true;
  snapshot.case.findings.push('altered');
  snapshot.log.length = 0;
  assert.equal(sim.flags.consent, undefined);
  assert.equal(sim.case.findings.includes('altered'), false);
  assert.ok(sim.log.length > 0);
});

test('unassessed early referral cannot earn a perfect assessment', () => {
  const sim = new Simulation();
  sim.dispatch('defer'); sim.dispatch('assess'); sim.dispatch('call_help');
  const result = sim.snapshot();
  assert.ok(result.score < 100);
  assert.equal(result.debrief.passed, false);
  assert.ok(result.debrief.improvements.some(item => item.includes('Sin demostrar')));
});

test('trauma full assessment and conservative referral can earn full applicable marks', () => {
  const sim = new Simulation('trauma');
  sim.dispatch('identify'); sim.dispatch('explain'); sim.dispatch('assess_risk');
  sim.dispatch('defer'); sim.dispatch('assess'); sim.dispatch('call_help');
  assert.equal(sim.snapshot().score, 100);
  assert.equal(sim.snapshot().debrief.passed, true);
});

for (const errorKind of ['overfill', 'unverified', 'underfill']) test(`${errorKind}: balloon deflation precedes closure of unsafe inflation`, () => {
  const sim = errorKind === 'unverified' ? prepared() : intravesical();
  if (errorKind === 'unverified') {
    sim.dispatch('advance', { value: 100 }); sim.dispatch('next'); sim.dispatch('premature_balloon');
  } else sim.dispatch('inflate', { volume: errorKind === 'overfill' ? 20 : 3 });
  sim.dispatch('stop'); sim.dispatch('assess'); sim.dispatch('call_help');
  assert.equal(sim.finished, false);
  sim.dispatch('deflate');
  assert.equal(sim.finished, true);
  assert.equal(sim.balloon, 0);
});

test('female vaginal misplacement requires a new sterile catheter before resuming', () => {
  const sim = prepared('female');
  assert.ok(sim.snapshot().actions.some(action => action.id === 'wrong_site'));
  sim.dispatch('wrong_site');
  assert.equal(sim.placement, 'vaginal');
  assert.equal(sim.event.id, 'vaginal_misplacement');
  assert.equal(sim.criticalFailure, false);
  assert.equal(sim.injury, null);
  assert.equal(sim.dispatch('premature_balloon').ok, false);
  assert.equal(sim.balloon, 0);
  sim.dispatch('stop'); sim.dispatch('assess');
  assert.equal(sim.dispatch('resume').ok, false);
  const before = sim.drainage;
  sim.tick(5);
  assert.equal(sim.drainage, before);
  sim.dispatch('new_sterile_catheter');
  assert.equal(sim.insertion, 0);
  assert.equal(sim.flags.confirmed, false);
  assert.equal(sim.flags.positionVerified, false);
  assert.equal(sim.dispatch('resume').ok, true);
  assert.equal(sim.event, null);
  assert.equal(sim.placement, 'urethral');
  assert.equal(sim.flags.vaginalMisplacementCorrected, true);
  sim.dispatch('advance', { value: 100 }); sim.dispatch('next');
  sim.dispatch('observe_urine'); sim.dispatch('verify_position'); sim.dispatch('confirm'); sim.dispatch('next');
  finish(sim);
  assert.equal(sim.finished, true);
  assert.equal(sim.outcome, 'completed');
  assert.equal(sim.errors.filter(item => item.id === 'vaginal_misplacement').length, 1);
  assert.ok(sim.snapshot().score < 100);
  assert.equal(sim.snapshot().debrief.passed, false);
});

test('male insertion does not expose or accept a female wrong-site action', () => {
  const sim = prepared();
  assert.equal(sim.snapshot().actions.some(action => action.id === 'wrong_site'), false);
  assert.equal(sim.dispatch('wrong_site').ok, false);
  assert.equal(sim.placement, 'urethral');
  assert.equal(sim.event, null);
});

test('replacing misplaced catheter alone cannot skip stopping and assessing', () => {
  const sim = prepared('female');
  sim.dispatch('wrong_site'); sim.dispatch('new_sterile_catheter');
  assert.equal(sim.dispatch('resume').ok, false);
  sim.dispatch('stop');
  assert.equal(sim.dispatch('resume').ok, false);
  sim.dispatch('assess');
  assert.equal(sim.dispatch('resume').ok, true);
});

for (const order of [
  ['stop', 'assess', 'call_help'], ['stop', 'call_help', 'assess'], ['assess', 'stop', 'call_help'],
  ['assess', 'call_help', 'stop'], ['call_help', 'stop', 'assess'], ['call_help', 'assess', 'stop']
]) test(`referral closes when all response actions complete: ${order.join(' → ')}`, () => {
  const sim = prepared('difficult');
  sim.dispatch('advance', { value: 70 });
  for (const action of order) sim.dispatch(action);
  assert.equal(sim.finished, true);
  assert.equal(sim.outcome, 'safe_referral');
  assert.equal(sim.event.stopped, true);
  assert.equal(sim.event.assessed, true);
  assert.equal(sim.event.called, true);
});
