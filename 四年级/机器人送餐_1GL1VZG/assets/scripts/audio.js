(function () {
  'use strict';
  var enabled = true, context = null, master = null, actors = {}, wanted = {}, lastVoice = -10000, voiceOwner = null;
  var voice = document.getElementById('success-voice'); voice.preload = 'auto'; voice.volume = 0.85;
  var primed = false, priming = false;
  function ready() {
    if (!enabled || document.hidden) return null;
    var AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!context && AudioEngine) {
      try { context = new AudioEngine(); master = context.createGain(); master.gain.value = 0.65; master.connect(context.destination); } catch (_) { context = null; }
    }
    if (context && context.state === 'suspended') { var resumed = context.resume(); if (resumed && resumed.then) resumed.then(function () { Object.keys(wanted).forEach(function (id) { if (wanted[id]) motor(+id, true); }); }).catch(function () {}); }
    return context;
  }
  function unlock() {
    ready();
    // Prime the same local media element in the user's gesture for older touch browsers.
    if (!enabled || primed || priming) return;
    priming = true; voice.volume = 0;
    try {
      var played = voice.play();
      var finish = function () { voice.pause(); voice.currentTime = 0; voice.volume = 0.85; primed = true; priming = false; };
      if (played && played.then) played.then(finish).catch(function () { voice.volume = 0.85; priming = false; }); else finish();
    } catch (_) { voice.volume = 0.85; priming = false; }
  }
  function tone(frequency, duration, when, type, volume, endFrequency) {
    var ctx = ready(); if (!ctx || ctx.state !== 'running') return;
    var osc = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + (when || 0);
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume || 0.06, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + duration + 0.02);
    osc.onended = function () { osc.disconnect(); gain.disconnect(); };
  }
  function stopMotor(id) {
    var actor = actors[id]; if (!actor) return;
    delete actors[id];
    try {
      actor.gain.gain.cancelScheduledValues(context.currentTime);
      actor.gain.gain.setValueAtTime(actor.gain.gain.value, context.currentTime);
      actor.gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.04);
      actor.oscillators.forEach(function (osc) { osc.stop(context.currentTime + 0.05); });
      actor.oscillators[0].onended = function () { actor.oscillators.forEach(function (osc) { osc.disconnect(); }); actor.modulation.disconnect(); actor.gain.disconnect(); };
    } catch (_) {}
  }
  function motor(id, active) {
    wanted[id] = !!active;
    if (!active || !enabled || document.hidden) return stopMotor(id);
    if (actors[id]) return;
    var ctx = ready(); if (!ctx || ctx.state !== 'running') return;
    var gain = ctx.createGain(), hum = ctx.createOscillator(), overtone = ctx.createOscillator(), pulse = ctx.createOscillator(), modulation = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.027, ctx.currentTime + 0.06);
    hum.type = 'sine'; hum.frequency.value = id ? 141 : 132; overtone.type = 'sine'; overtone.frequency.value = id ? 282 : 264;
    pulse.frequency.value = 8; modulation.gain.value = 0.008; pulse.connect(modulation); modulation.connect(gain.gain);
    hum.connect(gain); overtone.connect(gain); gain.connect(master); hum.start(); overtone.start(); pulse.start();
    actors[id] = { gain: gain, oscillators: [hum, overtone, pulse], modulation: modulation };
  }
  function cue(kind) {
    if (!enabled) return;
    if (kind === 'pickup') { tone(480, 0.15, 0, 'sine', 0.07); tone(720, 0.18, 0.12, 'sine', 0.06); }
    if (kind === 'turn') tone(330, 0.18, 0, 'sine', 0.045, 550);
    if (kind === 'deliver') { tone(784, 0.15, 0, 'sine', 0.06); tone(1047, 0.22, 0.11, 'sine', 0.05); }
  }
  function success(id) {
    if (!enabled || document.hidden || performance.now() - lastVoice < 1600) return;
    lastVoice = performance.now(); voiceOwner = id;
    tone(659, 0.19, 0, 'sine', 0.08); tone(831, 0.22, 0.14, 'sine', 0.07); tone(988, 0.3, 0.28, 'sine', 0.07);
    try { voice.currentTime = 0; voice.volume = 0.85; var played = voice.play(); if (played && played.catch) played.catch(function () {}); } catch (_) {}
  }
  function stopAll(includeVoice) {
    Object.keys(wanted).forEach(function (id) { wanted[id] = false; stopMotor(id); });
    if (includeVoice) { voice.pause(); try { voice.currentTime = 0; } catch (_) {} lastVoice = -10000; voiceOwner = null; }
  }
  function cancel(id) {
    motor(id, false);
    if (voiceOwner === id) { voice.pause(); try { voice.currentTime = 0; } catch (_) {} voiceOwner = null; lastVoice = -10000; }
  }
  function toggle() {
    enabled = !enabled;
    if (master) master.gain.setTargetAtTime(enabled ? 0.65 : 0, context.currentTime, 0.015);
    if (!enabled) { Object.keys(actors).forEach(stopMotor); voice.pause(); }
    else { unlock(); Object.keys(wanted).forEach(function (id) { if (wanted[id]) motor(+id, true); }); }
    return enabled;
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(true); });
  window.RobotSound = { unlock: unlock, motor: motor, cue: cue, success: success, cancel: cancel, stopAll: stopAll, toggle: toggle, enabled: function () { return enabled; } };
}());
