// NetGuard Pro v3.6 — Site Protection Policy Simulator
// Faithful port of backend/lib/siteProtection.js `protectionDecision` plus the
// Balanced profile defaults from backend/models/ProtectedSite.js, so the
// dashboard Attack Simulator demonstrates the REAL production policy engine.

export const BALANCED_PROFILE = Object.freeze({
  rateLimitEnabled: true,
  burstMaxRequests: 8,        // events inside the 5s burst window
  minuteMaxRequests: 60,      // events inside the 60s minute window
  repeatProtectionEnabled: true,
  repeatMaxSubmissions: 2,    // identical non-secret form hashes
  botDetectionEnabled: true,
  recaptchaEnabled: true,
  autoBlockEnabled: true,
  blockMinutes: 15,
});

export function createSiteProtectionSim(settings = BALANCED_PROFILE, now = () => Date.now()) {
  const state = {
    burstWindowStart: now(),
    burstCount: 0,
    minuteWindowStart: now(),
    minuteCount: 0,
    lastMessageHash: null,
    repeatCount: 0,
    blockedUntil: null,
    verifiedUntil: null,
    counters: { allowed: 0, challenged: 0, throttled: 0, blocked: 0 },
  };

  function rollWindows() {
    const t = now();
    if (t - state.burstWindowStart >= 5000) {
      state.burstWindowStart = t;
      state.burstCount = 0;
    }
    if (t - state.minuteWindowStart >= 60000) {
      state.minuteWindowStart = t;
      state.minuteCount = 0;
    }
  }

  // Mirrors backend protectionDecision() decision-for-decision.
  function decide({ messageHash = null, botSignal = false, recaptchaAvailable = false } = {}) {
    rollWindows();
    const t = now();

    const blockedActive = state.blockedUntil !== null && state.blockedUntil > t;
    if (blockedActive) {
      state.counters.blocked += 1;
      return {
        action: 'blocked', category: 'request-burst', severity: 'critical',
        reason: 'Temporary network block is active',
        blockedForMinutes: Math.max(1, Math.ceil((state.blockedUntil - t) / 60000)),
      };
    }

    const minuteExtreme = settings.rateLimitEnabled && state.minuteCount >= settings.minuteMaxRequests * 2;
    const burstExtreme = settings.rateLimitEnabled && state.burstCount >= settings.burstMaxRequests * 2;
    const repeatExtreme = settings.repeatProtectionEnabled && messageHash !== null
      && state.repeatCount >= settings.repeatMaxSubmissions + 2;
    const automation = settings.botDetectionEnabled && botSignal;
    const extreme = minuteExtreme || burstExtreme || repeatExtreme;

    if (extreme && settings.autoBlockEnabled) {
      const category = repeatExtreme ? 'repeat-submission' : minuteExtreme ? 'minute-rate' : 'request-burst';
      state.blockedUntil = t + settings.blockMinutes * 60000;
      state.counters.blocked += 1;
      return {
        action: 'blocked', category, severity: 'critical',
        reason: 'Automatic temporary block threshold reached',
        blockedForMinutes: settings.blockMinutes,
      };
    }

    const verified = state.verifiedUntil !== null && state.verifiedUntil > t;
    if (verified && !extreme) {
      state.counters.allowed += 1;
      return { action: 'allowed', category: 'normal', severity: 'info', reason: 'Recently verified visitor' };
    }

    const repeat = settings.repeatProtectionEnabled && messageHash !== null
      && state.repeatCount >= settings.repeatMaxSubmissions;
    const burst = settings.rateLimitEnabled && state.burstCount >= settings.burstMaxRequests;
    const minute = settings.rateLimitEnabled && state.minuteCount >= settings.minuteMaxRequests;
    const suspicious = repeat || burst || minute || automation;
    const category = repeat ? 'repeat-submission'
      : burst ? 'request-burst'
        : minute ? 'minute-rate'
          : automation ? 'automation' : 'normal';

    let result;
    if (suspicious && settings.recaptchaEnabled && recaptchaAvailable) {
      state.counters.challenged += 1;
      result = { action: 'challenged', category, severity: 'high', reason: 'Suspicious request pattern requires reCAPTCHA verification' };
    } else if (suspicious) {
      state.counters.throttled += 1;
      result = { action: 'throttled', category, severity: 'medium', reason: 'Suspicious request pattern was throttled' };
    } else {
      state.counters.allowed += 1;
      result = { action: 'allowed', category: 'normal', severity: 'info', reason: 'Request pattern is within configured limits' };
    }
    return result;
  }

  // Record one monitored form submission, then run the policy.
  function submitForm({ messageHash = 'contact-form-a1', botSignal = false, recaptchaAvailable = false } = {}) {
    rollWindows();
    state.burstCount += 1;
    state.minuteCount += 1;
    if (messageHash !== null) {
      if (messageHash === state.lastMessageHash) state.repeatCount += 1;
      else {
        state.lastMessageHash = messageHash;
        state.repeatCount = 1;
      }
    }
    return decide({ messageHash, botSignal, recaptchaAvailable });
  }

  return { state, decide, submitForm, settings };
}
