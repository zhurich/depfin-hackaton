// Ошибки не убивают питомца и не обнуляют прогресс: показатели падают только до «грустно», рост не убывает.
import { STAGES } from '../content/appearance'
import { NEEDS_THRESHOLD, STAT_MAX, STAT_MIN } from './rules'
import type { IconName, PetStage, PetStats } from './types'

export function clampStat(value: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(value)))
}

export function applyEffects(stats: PetStats, effects: Partial<PetStats>): PetStats {
  return {
    fullness: clampStat(stats.fullness + (effects.fullness ?? 0)),
    care: clampStat(stats.care + (effects.care ?? 0)),
    joy: clampStat(stats.joy + (effects.joy ?? 0)),
  }
}

export function decayStats(stats: PetStats, decay: PetStats): PetStats {
  return {
    fullness: clampStat(stats.fullness - decay.fullness),
    care: clampStat(stats.care - decay.care),
    joy: clampStat(stats.joy - decay.joy),
  }
}

export type Mood = 'happy' | 'ok' | 'sad'

export function moodOf(stats: PetStats): Mood {
  const avg = (stats.fullness + stats.care + stats.joy) / 3
  const anyCritical =
    stats.fullness < NEEDS_THRESHOLD || stats.care < NEEDS_THRESHOLD
  if (anyCritical || avg < 45) return 'sad'
  if (avg < 70) return 'ok'
  return 'happy'
}

export const MOOD_LABEL: Record<Mood, string> = {
  happy: 'Радуется',
  ok: 'Спокоен',
  sad: 'Грустит',
}

export function moodReason(stats: PetStats): string {
  if (stats.fullness < NEEDS_THRESHOLD && stats.care < NEEDS_THRESHOLD) {
    return 'Финни голоден, и ему нужен уход. Купи еду и купание.'
  }
  if (stats.fullness < NEEDS_THRESHOLD) return 'Финни проголодался. Купи ему еду.'
  if (stats.care < NEEDS_THRESHOLD) return 'Финни давно не купался. Купи уход.'
  if (stats.joy < NEEDS_THRESHOLD) {
    return 'Всё нужное есть, но Финни скучает. Поиграйте, когда появятся свободные финики.'
  }
  const avg = (stats.fullness + stats.care + stats.joy) / 3
  if (avg >= 80) return 'У Финни всё есть, и он доволен. Ты хорошо распределил деньги.'
  return 'У Финни всё в порядке.'
}

export function stageForGrowth(growth: number): PetStage {
  let current = STAGES[0]
  for (const stage of STAGES) {
    if (growth >= stage.minGrowth) current = stage
  }
  return current
}

export function stageIndex(stageId: string): number {
  const i = STAGES.findIndex((s) => s.id === stageId)
  return i < 0 ? 0 : i
}

export function growthToNextStage(growth: number): { needed: number; next: PetStage } | null {
  const next = STAGES.find((s) => s.minGrowth > growth)
  if (!next) return null
  return { needed: next.minGrowth - growth, next }
}

export const STAT_LABEL: Record<keyof PetStats, string> = {
  fullness: 'Сытость',
  care: 'Уход',
  joy: 'Радость',
}

export const STAT_ICON: Record<keyof PetStats, IconName> = {
  fullness: 'bowl',
  care: 'bath',
  joy: 'smile',
}

export const STAT_COLOR: Record<keyof PetStats, { ink: string; wash: string }> = {
  fullness: { ink: 'var(--need)', wash: 'var(--need-wash)' },
  care: { ink: 'var(--save)', wash: 'var(--save-wash)' },
  joy: { ink: 'var(--want)', wash: 'var(--want-wash)' },
}
