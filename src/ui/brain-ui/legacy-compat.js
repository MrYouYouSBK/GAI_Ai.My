// Browser-side legacy key migration for users upgrading from BaiLongma.
// New UI code should only use the GAI key.

const GAI_VOICE_SILENCE_KEY = 'gai-voice-silence-ms'
const LEGACY_VOICE_SILENCE_KEY = 'bailongma-voice-silence-ms'

export function readVoiceSilenceMs(storage = globalThis.localStorage) {
  if (!storage) return 2000

  let value = storage.getItem(GAI_VOICE_SILENCE_KEY)
  if (value == null) {
    const legacy = storage.getItem(LEGACY_VOICE_SILENCE_KEY)
    if (legacy != null) {
      value = legacy
      try { storage.setItem(GAI_VOICE_SILENCE_KEY, legacy) } catch {}
    }
  }

  const parsed = parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed >= 800 ? parsed : 2000
}
