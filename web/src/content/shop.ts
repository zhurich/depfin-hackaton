import type { ShopItem } from '../domain/types'

export const SHOP_ITEMS: ShopItem[] = [
  // Обязательные расходы
  {
    id: 'porridge',
    title: 'Каша',
    emoji: '🥣',
    price: 20,
    kind: 'essential',
    effects: { fullness: 30 },
    impact: 'Финни поест. Сытость вырастет.',
    perPeriodLimit: 2,
  },
  {
    id: 'dinner',
    title: 'Обед с овощами',
    emoji: '🥗',
    price: 35,
    kind: 'essential',
    effects: { fullness: 45, joy: 5 },
    impact: 'Сытный обед. Сытость сильно вырастет.',
    perPeriodLimit: 2,
  },
  {
    id: 'water',
    title: 'Чистая вода',
    emoji: '💧',
    price: 10,
    kind: 'essential',
    effects: { fullness: 10, care: 5 },
    impact: 'Немного сытости и свежести. Самая дешёвая нужная покупка.',
    perPeriodLimit: 3,
  },
  {
    id: 'wash',
    title: 'Купание и уход',
    emoji: '🛁',
    price: 25,
    kind: 'essential',
    effects: { care: 45 },
    impact: 'Финни будет чистым и ухоженным.',
    perPeriodLimit: 2,
  },
  {
    id: 'checkup',
    title: 'Осмотр у доктора',
    emoji: '🩺',
    price: 40,
    kind: 'essential',
    effects: { care: 25, fullness: 10, joy: 5 },
    impact: 'Плановый осмотр. Финни будет бодрым.',
    perPeriodLimit: 1,
  },

  // Необязательные расходы
  {
    id: 'ball',
    title: 'Мячик',
    emoji: '⚽',
    price: 25,
    kind: 'optional',
    effects: { joy: 20 },
    impact: 'Финни поиграет. Радость вырастет.',
    perPeriodLimit: 1,
  },
  {
    id: 'stickers',
    title: 'Наклейки',
    emoji: '✨',
    price: 20,
    kind: 'optional',
    effects: { joy: 15 },
    impact: 'Приятная мелочь. Немного радости.',
    perPeriodLimit: 2,
  },
  {
    id: 'hat',
    title: 'Шапочка',
    emoji: '🧢',
    price: 45,
    kind: 'optional',
    effects: { joy: 28 },
    impact: 'Финни будет модным. Радость заметно вырастет.',
    perPeriodLimit: 1,
  },
  {
    id: 'boat',
    title: 'Кораблик',
    emoji: '⛵',
    price: 55,
    kind: 'optional',
    effects: { joy: 32 },
    impact: 'Большая игрушка. Много радости, но и цена большая.',
    perPeriodLimit: 1,
  },
  {
    id: 'cake',
    title: 'Праздничный торт',
    emoji: '🎂',
    price: 60,
    kind: 'optional',
    effects: { joy: 35, fullness: 10 },
    impact: 'Праздник для Финни. Радости много, денег тоже уйдёт много.',
    perPeriodLimit: 1,
  },
  {
    id: 'book',
    title: 'Книжка',
    emoji: '📗',
    price: 30,
    kind: 'optional',
    effects: { joy: 18 },
    impact: 'Почитаете вместе. Радость вырастет.',
    perPeriodLimit: 1,
  },
  {
    id: 'plant',
    title: 'Цветок в горшке',
    emoji: '🪴',
    price: 35,
    kind: 'optional',
    effects: { joy: 20, care: 5 },
    impact: 'Украсит домик Финни. Немного радости и уюта.',
    perPeriodLimit: 1,
  },
]

export const ESSENTIAL_ITEMS = SHOP_ITEMS.filter((i) => i.kind === 'essential')
export const OPTIONAL_ITEMS = SHOP_ITEMS.filter((i) => i.kind === 'optional')

export function shopItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id)
}
