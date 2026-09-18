// Звук синтезируется через Web Audio и только дублирует текст на экране.

export type SoundName = 'tap' | 'coin' | 'success' | 'blocked'

const TONES: Record<SoundName, { freq: number[]; duration: number; gain: number }> = {
  tap: { freq: [520], duration: 0.05, gain: 0.05 },
  coin: { freq: [740, 980], duration: 0.09, gain: 0.07 },
  success: { freq: [523, 659, 784], duration: 0.11, gain: 0.07 },
  blocked: { freq: [320, 240], duration: 0.11, gain: 0.06 },
}

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(value: boolean) {
  enabled = value
}

export function playSound(name: SoundName) {
  if (!enabled) return
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
    }
    // WebView может держать контекст приостановленным до первого жеста.
    if (ctx.state === 'suspended') void ctx.resume()

    const tone = TONES[name]
    tone.freq.forEach((freq, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      const start = ctx!.currentTime + i * tone.duration
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(tone.gain, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(start)
      osc.stop(start + tone.duration)
    })
  } catch {
    // ignore
  }
}
