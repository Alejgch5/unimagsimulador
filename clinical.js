/* Browser-only presentation. Clinical decisions and signs come from engine.js. */

/** Native Spanish speech with bundled, offline synthetic audio as a fallback. */
export class PatientVoice {
  constructor({onStatus} = {}) {
    this.enabled = true;
    this.speaking = false;
    this._synth = globalThis.speechSynthesis;
    this._nativeAvailable = Boolean(this._synth && typeof globalThis.SpeechSynthesisUtterance !== 'undefined');
    this._audio = typeof globalThis.Audio === 'function' ? new Audio() : null;
    if (this._audio) this._audio.preload = 'auto';
    this.available = this._nativeAvailable || Boolean(this._audio);
    this._onStatus = typeof onStatus === 'function' ? onStatus : () => {};
    this._activated = false;
    this._paused = false;
    this._disposed = false;
    this._active = null;
    this._activeKind = null;
    this._latest = null;
    this._pending = null;
    this._lastId = null;
    this._lastText = '';
    this._watchdog = null;
    this._manifest = {};
    this._manifestLoaded = false;
    this._nativeBroken = false;
    this._voices = this._synth?.getVoices?.() || [];
    this._message = this.available ? 'Voz activada · se iniciará al comenzar el caso' : 'Voz no disponible · lee los subtítulos';
    this._refreshVoices = () => { this._voices = this._synth?.getVoices?.() || []; };
    this._synth?.addEventListener?.('voiceschanged', this._refreshVoices);
    this.ready = this._loadManifest();
    this._emit();
  }

  get status() { return this._message; }

  async _loadManifest() {
    if (this._audio && typeof globalThis.fetch === 'function') {
      try {
        const response = await fetch(new URL('./assets/voice/manifest.json', import.meta.url));
        if (!response.ok) throw new Error('Manifest unavailable');
        const entries = await response.json();
        // Restrict fallback audio to bundled files, never remote user-supplied URLs.
        for (const [phrase, path] of Object.entries(entries)) {
          if (typeof path === 'string' && /^assets\/voice\/[a-zA-Z0-9_.-]+\.(mp3|wav|ogg)$/.test(path)) this._manifest[phrase] = path;
        }
      } catch { /* Native voices can still be used. A failed clip never hides text. */ }
    }
    this._manifestLoaded = true;
    if (this._disposed) return;
    this.available = Boolean(this._chooseVoice() || (this._audio && Object.keys(this._manifest).length));
    if (this._pending && this._activated && this.enabled && !this._paused && !this._active) {
      const request = this._pending;
      this._pending = null;
      this._speak(request);
    } else if (!this.available) this._emit('No hay voz en español disponible · lee los subtítulos');
  }

  _emit(message) {
    if (message) this._message = message;
    this._onStatus({message: this._message, enabled: this.enabled, speaking: this.speaking, available: this.available});
  }

  /** Call directly within a click/tap. Await ready before enabling the start control. */
  activate(text, sex = 'male') {
    if (this._disposed) return;
    this._activated = true;
    this._paused = false;
    this.enabled = true;
    this._voices = this._synth?.getVoices?.() || [];
    this.available = Boolean(this._chooseVoice() || this._audio);
    const request = {text: String(text || this._latest?.text || '').trim(), sex, urgent: false};
    this._pending = null;
    this._lastId = null;
    this._lastText = '';
    this._cancel();
    this._synth?.resume();
    if (request.text) this._speak(request);
    else this._emit('Voz lista · esperando respuesta del paciente');
  }

  say(text, {urgent = false, sex = 'male', id} = {}) {
    if (this._disposed) return;
    const normalized = String(text || '').trim();
    if (!normalized) return;
    const request = {text: normalized, urgent: Boolean(urgent), sex, id};
    this._latest = request;
    if (!this.enabled) return;
    if (!this._activated) {
      this._pending = request;
      if (this.available) this._emit('Voz activada · pulsa Comenzar para escuchar al paciente');
      return;
    }
    if (this._paused) { this._pending = request; return; }
    if ((id !== undefined && id === this._lastId) || normalized === this._lastText) return;
    this._speak(request);
  }

  _chooseVoice() {
    if (!this._nativeAvailable || this._nativeBroken) return undefined;
    const voices = this._voices.length ? this._voices : this._synth.getVoices() || [];
    return voices.find(v => /^es[-_]CO$/i.test(v.lang)) || voices.find(v => /^es[-_]ES$/i.test(v.lang)) || voices.find(v => /^es(?:[-_]|$)/i.test(v.lang));
  }

  _cancel() {
    clearTimeout(this._watchdog);
    this._watchdog = null;
    this._active = null;
    this._activeKind = null;
    this.speaking = false;
    this._synth?.cancel();
    if (this._audio) { this._audio.pause(); try { this._audio.currentTime = 0; } catch {} }
  }

  _speak(request) {
    if (this._disposed || !this.enabled || this._paused) return;
    this._latest = request;
    this._pending = null;
    this._cancel();
    this._lastId = request.id;
    this._lastText = request.text;
    const voice = !request.localOnly && this._chooseVoice();
    if (!voice) { this._playLocal(request); return; }
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.96;
    utterance.pitch = request.sex === 'female' ? 1.06 : 0.94;
    utterance.volume = 1;
    this._active = utterance;
    this._activeKind = 'native';
    const current = () => !this._disposed && this._active === utterance;
    utterance.onstart = () => {
      if (!current()) return;
      clearTimeout(this._watchdog);
      this.speaking = !this._paused;
      this._emit(this._paused ? 'Voz en pausa' : 'Paciente hablando');
    };
    utterance.onpause = () => {
      if (!current()) return;
      this.speaking = false;
      this._emit('Voz en pausa');
    };
    utterance.onresume = () => {
      if (!current() || this._paused) return;
      this.speaking = true;
      this._emit('Paciente hablando');
    };
    utterance.onend = () => {
      if (!current()) return;
      clearTimeout(this._watchdog);
      this._active = null;
      this._activeKind = null;
      this.speaking = false;
      this._emit(this._paused ? 'Voz en pausa' : 'Voz lista');
    };
    utterance.onerror = event => {
      if (!current() || event.error === 'canceled' || event.error === 'interrupted') return;
      this._nativeBroken = true;
      this._cancel();
      this._playLocal({...request, localOnly: true});
    };
    this._emit('Preparando voz del paciente…');
    try {
      this._synth.resume();
      this._synth.speak(utterance);
      this._watchdog = setTimeout(() => {
        if (current() && !this.speaking && !this._paused) {
          this._nativeBroken = true;
          this._cancel();
          this._playLocal({...request, localOnly: true});
        }
      }, 2500);
    } catch {
      this._nativeBroken = true;
      this._cancel();
      this._playLocal({...request, localOnly: true});
    }
  }

  _playLocal(request) {
    if (this._disposed || !this.enabled) return;
    if (!this._manifestLoaded && this._audio) {
      this._pending = {...request, localOnly: true};
      this._emit('Cargando voz sintética local…');
      return;
    }
    const path = this._manifest[request.text];
    if (!this._audio || !path) {
      this.speaking = false;
      this.available = Boolean(this._chooseVoice() || Object.keys(this._manifest).length);
      this._emit('Esta respuesta no tiene audio disponible · lee los subtítulos');
      return;
    }
    if (this._paused) { this._pending = {...request, localOnly: true}; return; }
    const audio = this._audio;
    const token = {};
    this._active = token;
    this._activeKind = 'local';
    this.available = true;
    audio.src = new URL(path, import.meta.url).href;
    audio.onplaying = () => {
      if (this._disposed || this._active !== token) return;
      this.speaking = !this._paused;
      this._emit(this._paused ? 'Voz en pausa' : 'Voz sintética local · paciente hablando');
    };
    audio.onended = () => {
      if (this._disposed || this._active !== token) return;
      this._active = null;
      this._activeKind = null;
      this.speaking = false;
      this._emit('Voz sintética local · lista');
    };
    audio.onerror = () => {
      if (this._disposed || this._active !== token) return;
      this._active = null;
      this._activeKind = null;
      this.speaking = false;
      this._emit('No se pudo cargar el audio local · lee los subtítulos');
    };
    this._emit('Preparando voz sintética local…');
    this._playAudio(token);
  }

  _playAudio(token) {
    try {
      const playing = this._audio.play();
      playing?.catch(error => {
        if (this._disposed || this._active !== token || this._paused) return;
        this._active = null;
        this._activeKind = null;
        this.speaking = false;
        if (error?.name === 'NotAllowedError') {
          this._activated = false;
          this._emit('El navegador bloqueó el audio · pulsa el control de voz para escucharlo');
        } else this._emit('No se pudo reproducir el audio · lee los subtítulos y reintenta desde el control de voz');
      });
    } catch {
      this.speaking = false;
      this._emit('No se pudo iniciar el audio · lee los subtítulos');
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this._cancel();
      this._pending = null;
      this._emit('Voz desactivada · subtítulos disponibles');
    } else this.activate(this._latest?.text || '', this._latest?.sex || 'male');
  }

  pause() {
    if (this._disposed || this._paused) return;
    this._paused = true;
    if (this._activeKind === 'local') this._audio.pause();
    else this._synth?.pause();
    this.speaking = false;
    if (this.enabled) this._emit('Voz en pausa');
  }

  resume() {
    if (this._disposed || !this._paused) return;
    this._paused = false;
    if (!this.enabled) return;
    if (this._pending) {
      const request = this._pending;
      this._pending = null;
      this._speak(request);
    } else if (this._activeKind === 'local') this._playAudio(this._active);
    else { this._synth?.resume(); this._emit(this._active ? 'Reanudando voz…' : 'Voz lista'); }
  }

  stop() {
    this._cancel();
    this._pending = null;
    this._lastId = null;
    this._lastText = '';
    if (!this._disposed) this._emit(this.enabled ? 'Voz detenida' : 'Voz desactivada · subtítulos disponibles');
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._cancel();
    this._pending = null;
    this._synth?.removeEventListener?.('voiceschanged', this._refreshVoices);
    if (this._audio) {
      this._audio.onplaying = null;
      this._audio.onended = null;
      this._audio.onerror = null;
      this._audio.removeAttribute('src');
      this._audio.load();
    }
    this._onStatus = () => {};
  }
}

/** Decorative pulse/respiration trace. Not an ECG or diagnostic signal. */
export class MonitorTrace {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') || null;
    this.snapshot = {hr: 80, rr: 16, elapsed: 0, paused: true};
    this._stamp = globalThis.performance?.now?.() || 0;
    this._disposed = false;
    this._frame = null;
    this._motion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    this._draw = this._draw.bind(this);
    if (this.ctx && typeof requestAnimationFrame === 'function') this._frame = requestAnimationFrame(this._draw);
  }

  update(snapshot = {}) {
    this.snapshot = snapshot || {};
    this._stamp = globalThis.performance?.now?.() || 0;
  }

  _draw(now) {
    if (this._disposed || !this.ctx || !this.canvas) return;
    const canvas = this.canvas, ctx = this.ctx;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5);
    const width = Math.max(100, canvas.clientWidth || 420);
    const height = Math.max(50, canvas.clientHeight || 108);
    const pw = Math.round(width * dpr), ph = Math.round(height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#071c27'); bg.addColorStop(1, '#081923');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#15313d'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x < width; x += 22) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y < height; y += 18) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();
    const s = this.snapshot, vitals = s.vitals || s;
    const hr = Math.max(20, Math.min(220, Number(vitals.hr) || 80));
    const rr = Math.max(4, Math.min(60, Number(vitals.rr) || 16));
    const elapsed = Math.max(0, Number(s.elapsed) || 0);
    const time = this._motion?.matches ? 0 : elapsed + (s.paused ? 0 : Math.max(0, now - this._stamp) / 1000);
    const windowSeconds = 7;
    const gauss = (x, center, spread) => Math.exp(-Math.pow((x - center) / spread, 2));
    for (let row = 0; row < 2; row++) {
      const baseline = height * (row ? 0.78 : 0.37);
      const amplitude = height * (row ? 0.105 : 0.27);
      const color = row ? '#6bb9e1' : '#5cdab6';
      ctx.beginPath();
      ctx.lineWidth = row ? 1.5 : 1.8;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      for (let x = 0; x <= width; x += 1.5) {
        const t = time - (1 - x / width) * windowSeconds;
        const phase = ((t * hr / 60) % 1 + 1) % 1;
        const value = row ? Math.sin(t * rr / 60 * Math.PI * 2) : gauss(phase, 0.23, 0.075) + 0.30 * gauss(phase, 0.48, 0.13) - 0.10 * gauss(phase, 0.40, 0.025);
        const y = baseline - value * amplitude;
        if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillText(row ? 'RESP' : 'PULSO', 7, row ? height * 0.61 : 12);
    }
    this._frame = requestAnimationFrame(this._draw);
  }

  dispose() {
    this._disposed = true;
    if (this._frame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._frame);
  }
}
