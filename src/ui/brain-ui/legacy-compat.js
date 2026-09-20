// Browser-side compatibility boundary for users upgrading from BaiLongma.
//
// Rules:
// - New code writes only GAI keys.
// - A missing GAI key may be seeded from its legacy key.
// - Legacy keys are not deleted during the migration window, so rollback stays safe.

const STORAGE = Object.freeze({
  activationWarmup: { current: 'gai.activation-warmup-until', legacy: ['bailongma_activation_warmup_until'] },
  uiZoom: { current: 'gai.ui-zoom-factor', legacy: ['bailongma_ui_zoom_factor'] },
  memoryGraphEnabled: { current: 'gai.memory-graph-enabled', legacy: ['bailongma-memory-graph-enabled'] },
  ignoredUpdateVersion: { current: 'gai.ignored-update-version', legacy: ['bailongma_ignored_update_version'] },
  suppressUpdateNotifications: { current: 'gai.suppress-update-notifications', legacy: ['bailongma_suppress_update_notifications'] },
  ttsStreaming: { current: 'gai.tts.streaming', legacy: ['bailongma.tts.streaming'] },

  voiceLanguage: { current: 'gai.voice.language', legacy: ['bailongma-voice-lang'] },
  voiceProvider: { current: 'gai.voice.provider', legacy: ['bailongma-voice-provider'] },
  voiceAutoSend: { current: 'gai.voice.auto-send', legacy: ['bailongma-voice-auto-send'] },
  voiceAutoMic: { current: 'gai.voice.auto-mic', legacy: ['bailongma-voice-auto-mic'] },
  voiceThreshold: { current: 'gai.voice.threshold', legacy: ['bailongma-voice-threshold'] },
  voiceMicDevice: { current: 'gai.voice.mic-device-id', legacy: ['bailongma-voice-mic-device-id'] },
  voiceSilenceMs: { current: 'gai.voice.silence-ms', legacy: ['bailongma-voice-silence-ms'] },
  voiceDiag: { current: 'gai.voice.diag', legacy: ['bailongma-voice-diag'] },
  voiceWatchdog: { current: 'gai.voice.watchdog', legacy: ['bailongma-voice-watchdog'] },

  ttsFxV2: { current: 'gai.ttsfx.v2', legacy: ['bailongma.ttsfx.v2'] },
  ttsFxVoices: { current: 'gai.ttsfx.voices', legacy: ['bailongma.ttsfx.voices'] },
  ttsFxUnlocked: { current: 'gai.ttsfx.unlocked', legacy: ['bailongma.ttsfx.unlocked'] },
})

function storageOrNull(storage) {
  return storage || globalThis.localStorage || null
}

function entry(name) {
  const value = STORAGE[name]
  if (!value) throw new Error(`Unknown GAI UI storage key: ${name}`)
  return value
}

export function storageKey(name, storage = globalThis.localStorage) {
  const spec = entry(name)
  const target = storageOrNull(storage)
  if (!target) return spec.current

  try {
    if (target.getItem(spec.current) == null) {
      for (const legacyKey of spec.legacy) {
        const legacy = target.getItem(legacyKey)
        if (legacy != null) {
          target.setItem(spec.current, legacy)
          break
        }
      }
    }
  } catch {}
  return spec.current
}

export function readUiStorage(name, fallback = null, storage = globalThis.localStorage) {
  const target = storageOrNull(storage)
  if (!target) return fallback
  const key = storageKey(name, target)
  try {
    const value = target.getItem(key)
    return value == null ? fallback : value
  } catch {
    return fallback
  }
}

export function writeUiStorage(name, value, storage = globalThis.localStorage) {
  const target = storageOrNull(storage)
  if (!target) return
  const key = storageKey(name, target)
  try { target.setItem(key, String(value)) } catch {}
}

export function removeUiStorage(name, storage = globalThis.localStorage) {
  const target = storageOrNull(storage)
  if (!target) return
  const key = storageKey(name, target)
  try { target.removeItem(key) } catch {}
}

export function readVoiceSilenceMs(storage = globalThis.localStorage) {
  const parsed = parseInt(readUiStorage('voiceSilenceMs', '', storage), 10)
  return Number.isFinite(parsed) && parsed >= 800 ? parsed : 2000
}

export function migrateKnownUiStorage(storage = globalThis.localStorage) {
  for (const name of Object.keys(STORAGE)) storageKey(name, storage)
}
