import test from 'node:test';
import assert from 'node:assert/strict';
import { PatientVoice } from '../clinical.js';

// These tests verify browser API orchestration, not audible quality or human realism.
// Actual bundled MP3 decoding/playback is checked separately in browser smoke tests.
const phrases = {
  'Me duele.': 'assets/voice/pain.mp3',
  'Deténgase, por favor.': 'assets/voice/stop.mp3',
  'Ahora me siento mejor.': 'assets/voice/relief.mp3'
};

function browserAPIs(t, {voices = [{lang: 'es-CO'}], playback = 'start', manifest = phrases} = {}) {
  const names = ['Audio', 'speechSynthesis', 'SpeechSynthesisUtterance', 'fetch'];
  const originals = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const audio = [], utterances = [], statuses = [], listeners = new Map(), patients = [];
  const calls = {cancel: 0, pause: 0, resume: 0};
  let currentVoices = voices;
  class FakeAudio {
    constructor() { this.plays = 0; this.pauses = 0; this.loads = 0; this.currentTime = 0; audio.push(this); }
    pause() { this.pauses++; }
    play() {
      this.plays++;
      if (playback === 'blocked') return Promise.reject(Object.assign(new Error('User gesture required'), {name: 'NotAllowedError'}));
      if (playback === 'start') this.onplaying?.();
      return Promise.resolve();
    }
    removeAttribute(name) { if (name === 'src') delete this.src; }
    load() { this.loads++; }
  }
  const synth = {
    getVoices: () => currentVoices,
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type, handler) => { if (listeners.get(type) === handler) listeners.delete(type); },
    cancel: () => calls.cancel++, pause: () => calls.pause++, resume: () => calls.resume++,
    speak: utterance => utterances.push(utterance)
  };
  Object.assign(globalThis, {
    Audio: FakeAudio,
    speechSynthesis: synth,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    fetch: async url => {
      assert.match(String(url), /assets\/voice\/manifest\.json$/);
      return {ok: true, json: async () => manifest};
    }
  });
  t.after(() => {
    for (const patient of patients) patient.dispose();
    for (const name of names) {
      if (originals.get(name)) Object.defineProperty(globalThis, name, originals.get(name));
      else delete globalThis[name];
    }
  });
  return {
    audio, utterances, statuses, listeners, calls,
    async patient() {
      const voice = new PatientVoice({onStatus: status => statuses.push({...status})});
      patients.push(voice);
      await voice.ready;
      return voice;
    },
    changeVoices(next) { currentVoices = next; listeners.get('voiceschanged')?.(); }
  };
}

test('voice is enabled by default but waits for activation rather than assuming autoplay', async t => {
  const api = browserAPIs(t);
  const voice = await api.patient();
  assert.equal(voice.enabled, true);
  assert.equal(voice.speaking, false);
  assert.equal(api.utterances.length, 0);
  voice.say('Me duele.', {id: 1});
  assert.equal(api.utterances.length, 0);
  voice.activate('Me duele.', 'male');
  assert.equal(api.utterances.length, 1);
  assert.equal(voice.speaking, false, 'speak() alone does not establish successful playback');
  api.utterances[0].onstart();
  assert.equal(voice.speaking, true);
  api.utterances[0].onend();
  assert.equal(voice.speaking, false);
});

test('native Spanish voice selection prefers Colombia, then Spain, over an English default', async t => {
  const api = browserAPIs(t, {voices: [{lang: 'en-US'}, {lang: 'es-MX'}, {lang: 'es-ES'}, {lang: 'es-CO'}]});
  const voice = await api.patient();
  voice.activate('Me duele.', 'female');
  assert.equal(api.utterances[0].voice.lang, 'es-CO');
  assert.equal(api.utterances[0].rate, 0.96);
  api.changeVoices([{lang: 'en-US'}, {lang: 'es-MX'}, {lang: 'es-ES'}]);
  voice.activate('Me duele.');
  assert.equal(api.utterances[1].voice.lang, 'es-ES');
  assert.equal(api.audio[0].plays, 0);
});

test('repainting a dialogue does not repeat speech; urgent symptoms replace stale narration', async t => {
  const api = browserAPIs(t);
  const voice = await api.patient();
  voice.activate('Me duele.');
  const stale = api.utterances[0];
  voice.say('Me duele.', {id: 1});
  assert.equal(api.utterances.length, 1);
  voice.say('Deténgase, por favor.', {id: 2, urgent: true});
  assert.equal(api.utterances.length, 2);
  assert.equal(api.utterances[1].text, 'Deténgase, por favor.');
  assert.ok(api.calls.cancel >= 2);
  api.utterances[1].onstart();
  stale.onend();
  assert.equal(voice.speaking, true, 'an old utterance must not overwrite current playback state');
  voice.say('Ahora me siento mejor.', {id: 2});
  assert.equal(api.utterances.length, 2, 'the same dialogue id must not repeat');
});

test('native playback reports actual resume events after a simulation pause', async t => {
  const api = browserAPIs(t);
  const voice = await api.patient();
  voice.activate('Me duele.');
  const utterance = api.utterances[0];
  utterance.onstart();
  voice.pause();
  utterance.onpause();
  assert.equal(voice.speaking, false);
  voice.resume();
  assert.equal(voice.speaking, false, 'resume() must wait for an actual browser event');
  utterance.onresume();
  assert.equal(voice.speaking, true);
  assert.match(voice.status, /Paciente hablando/);
});

test('an installed browser without Spanish voices plays an exact bundled local clip', async t => {
  const api = browserAPIs(t, {voices: [{lang: 'en-US'}]});
  const voice = await api.patient();
  voice.activate('Me duele.');
  assert.equal(api.utterances.length, 0);
  assert.equal(api.audio[0].plays, 1);
  assert.match(api.audio[0].src, /assets\/voice\/pain\.mp3$/);
  assert.equal(voice.speaking, true);
  assert.match(voice.status, /sintética local/);
  voice.say('Deténgase, por favor.', {id: 2, urgent: true});
  assert.equal(api.audio[0].plays, 2);
  assert.match(api.audio[0].src, /stop\.mp3$/);
});

test('native synthesis failure falls back to the bundled phrase without claiming native success', async t => {
  const api = browserAPIs(t);
  const voice = await api.patient();
  voice.activate('Me duele.');
  assert.equal(voice.speaking, false);
  api.utterances[0].onerror({error: 'synthesis-failed'});
  assert.equal(api.audio[0].plays, 1);
  assert.equal(voice.speaking, true);
  assert.match(voice.status, /sintética local/);
});

test('paused local playback holds new symptoms and resumes only the latest dialogue', async t => {
  const api = browserAPIs(t, {voices: []});
  const voice = await api.patient();
  voice.activate('Me duele.');
  const pausesBefore = api.audio[0].pauses;
  voice.pause();
  assert.ok(api.audio[0].pauses > pausesBefore);
  assert.equal(voice.speaking, false);
  voice.say('Deténgase, por favor.', {id: 2});
  voice.say('Ahora me siento mejor.', {id: 3});
  assert.equal(api.audio[0].plays, 1);
  voice.resume();
  assert.equal(api.audio[0].plays, 2);
  assert.match(api.audio[0].src, /relief\.mp3$/);
});

test('blocked playback and missing audio remain visible and never claim successful speech', async t => {
  const api = browserAPIs(t, {voices: [], playback: 'blocked'});
  const voice = await api.patient();
  voice.activate('Me duele.');
  await Promise.resolve();
  assert.equal(voice.speaking, false);
  assert.match(voice.status, /bloqueó/);
  assert.ok(api.statuses.every(s => s.speaking === false));
  voice.activate('Respuesta sin grabación.');
  assert.equal(api.audio[0].plays, 1);
  assert.equal(voice.speaking, false);
  assert.match(voice.status, /no tiene audio/);
});

test('audio loading errors retain subtitles and do not trigger a success status', async t => {
  const api = browserAPIs(t, {voices: [], playback: 'manual'});
  const voice = await api.patient();
  voice.activate('Me duele.');
  assert.equal(voice.speaking, false);
  api.audio[0].onerror();
  assert.equal(voice.speaking, false);
  assert.match(voice.status, /No se pudo cargar/);
  assert.ok(api.statuses.every(s => s.speaking === false));
});

test('silencing and disposal stop both APIs and remove playback callbacks/listeners', async t => {
  const api = browserAPIs(t, {voices: []});
  const voice = await api.patient();
  voice.activate('Me duele.');
  voice.setEnabled(false);
  assert.equal(voice.enabled, false);
  assert.equal(voice.speaking, false);
  voice.say('Ahora me siento mejor.', {id: 2});
  assert.equal(api.audio[0].plays, 1);
  voice.setEnabled(true);
  assert.equal(api.audio[0].plays, 2);
  assert.match(api.audio[0].src, /relief\.mp3$/);
  const cancelsBefore = api.calls.cancel, pausesBefore = api.audio[0].pauses;
  voice.dispose();
  assert.ok(api.calls.cancel > cancelsBefore);
  assert.ok(api.audio[0].pauses > pausesBefore);
  assert.equal(api.audio[0].onplaying, null);
  assert.equal(api.audio[0].onended, null);
  assert.equal(api.audio[0].onerror, null);
  assert.equal(api.audio[0].src, undefined);
  assert.equal(api.listeners.size, 0);
  voice.say('Me duele.', {id: 3});
  assert.equal(api.audio[0].plays, 2);
});

test('the manifest cannot redirect symptom playback to an external audio destination', async t => {
  const api = browserAPIs(t, {voices: [], manifest: {'Me duele.': 'https://example.invalid/voice.mp3'}});
  const voice = await api.patient();
  voice.activate('Me duele.');
  assert.equal(api.audio[0].plays, 0);
  assert.equal(voice.speaking, false);
  assert.match(voice.status, /no tiene audio/);
});
