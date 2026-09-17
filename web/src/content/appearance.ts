import type { PetStage } from '../domain/types'

export interface Species {
  id: string
  title: string
  ears: 'pointy' | 'round' | 'long' | 'horns'
  tail: 'fluffy' | 'thin' | 'none' | 'spike'
}

export const SPECIES: Species[] = [
  { id: 'fox', title: 'Лисёнок', ears: 'pointy', tail: 'fluffy' },
  { id: 'cat', title: 'Котёнок', ears: 'round', tail: 'thin' },
  { id: 'bunny', title: 'Зайчик', ears: 'long', tail: 'none' },
  { id: 'dragon', title: 'Дракоша', ears: 'horns', tail: 'spike' },
]

export interface Palette {
  id: string
  title: string
  body: string
  belly: string
  detail: string
}

export const PALETTES: Palette[] = [
  { id: 'orange', title: 'Рыжий', body: '#F2913D', belly: '#FFE6CC', detail: '#C96A1F' },
  { id: 'mint', title: 'Мятный', body: '#5FC3A6', belly: '#DFF5EE', detail: '#2F8C74' },
  { id: 'lilac', title: 'Сиреневый', body: '#9B7EDE', belly: '#EBE3FB', detail: '#6A4BB5' },
  { id: 'sky', title: 'Небесный', body: '#5AA9E6', belly: '#DDEEFB', detail: '#2A74B0' },
  { id: 'sand', title: 'Песочный', body: '#E0B25C', belly: '#FBF0D8', detail: '#A97C2A' },
]

export interface Accessory {
  id: string
  title: string
  kind: 'none' | 'scarf' | 'cap' | 'glasses'
  color: string
}

export const ACCESSORIES: Accessory[] = [
  { id: 'none', title: 'Без аксессуара', kind: 'none', color: 'transparent' },
  { id: 'scarf', title: 'Шарфик', kind: 'scarf', color: '#E4572E' },
  { id: 'cap', title: 'Кепка', kind: 'cap', color: '#3D5A80' },
  { id: 'glasses', title: 'Очки', kind: 'glasses', color: '#2B2D42' },
]

export const APPEARANCE_COMBINATIONS =
  SPECIES.length * PALETTES.length * ACCESSORIES.length

export const STAGES: PetStage[] = [
  {
    id: 'baby',
    title: 'Малыш',
    minGrowth: 0,
    caption: 'Финни только учится. Ему нужна еда и уход каждую неделю.',
  },
  {
    id: 'curious',
    title: 'Почемучка',
    minGrowth: 6,
    caption: 'Финни подрос: ты не забываешь про обязательные расходы.',
  },
  {
    id: 'smart',
    title: 'Знаток',
    minGrowth: 14,
    caption: 'Финни стал умнее: твои траты совпадают с планом.',
  },
  {
    id: 'wise',
    title: 'Мудрый Финни',
    minGrowth: 24,
    caption: 'Финни гордится тобой: ты планируешь и копишь регулярно.',
  },
]

export function speciesById(id: string): Species {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0]
}

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}

export function accessoryById(id: string): Accessory {
  return ACCESSORIES.find((a) => a.id === id) ?? ACCESSORIES[0]
}
