// Чтобы добавить задание, достаточно дописать объект в массив.
import type { IconName, Quest, QuestTopic } from '../domain/types'

export const TOPIC_TITLES: Record<QuestTopic, string> = {
  planning: 'Планирование бюджета',
  saving: 'Как копить',
  spending: 'Покупки и оплата',
}

export const TOPIC_ICON: Record<QuestTopic, IconName> = {
  planning: 'envelope',
  saving: 'jar',
  spending: 'cart',
}

export const QUESTS: Quest[] = [
  // Планирование бюджета
  {
    id: 'plan-week',
    topic: 'planning',
    kind: 'allocate',
    title: 'Неделя Финни',
    situation: 'На неделю у Финни есть 120 фиников.',
    task: 'Разложи деньги по трём конвертам. Еда и уход — это то, без чего нельзя.',
    baseReward: 20,
    amount: 120,
    lanes: [
      { id: 'essential', title: 'Нужное', icon: 'bowl' },
      { id: 'optional', title: 'Желанное', icon: 'kite' },
      { id: 'savings', title: 'Копилка', icon: 'jar' },
    ],
    rules: [
      { lane: 'essential', min: 60, because: 'Еда и уход на неделю стоят около 60 фиников.' },
      { lane: 'savings', min: 10, because: 'Хоть немного полезно откладывать каждую неделю.' },
    ],
    goodExplanation:
      'Ты оставил достаточно на еду и уход и не забыл про копилку. Так деньги не кончатся раньше времени.',
    softExplanation:
      'Сначала откладывают на нужное — еду и уход. На неделю это около 60 фиников. То, что останется, можно потратить на желанное и положить в копилку.',
  },
  {
    id: 'plan-order',
    topic: 'planning',
    kind: 'order',
    title: 'Что сначала?',
    situation: 'Финни хочет всё сразу, но денег хватит не на всё.',
    task: 'Расставь покупки по важности: самое нужное — наверх.',
    baseReward: 18,
    items: [
      { id: 'food', title: 'Еда на неделю', icon: 'bowl' },
      { id: 'wash', title: 'Купание', icon: 'bath' },
      { id: 'piggy', title: 'Отложить в копилку', icon: 'jar' },
      { id: 'toy', title: 'Новая игрушка', icon: 'ball' },
    ],
    correctOrder: ['food', 'wash', 'piggy', 'toy'],
    goodExplanation:
      'Верно. Сначала то, без чего нельзя, потом копилка, и только потом желанное.',
    softExplanation:
      'Сначала идут обязательные расходы — еда и купание. Потом копилка: если отложить сразу, деньги не разойдутся. Игрушка — в самом конце, её можно купить и на следующей неделе.',
  },
  {
    id: 'plan-leftover',
    topic: 'planning',
    kind: 'number',
    title: 'Сколько останется?',
    situation: 'У Финни 100 фиников. Еда стоит 35, купание — 25.',
    task: 'Посчитай, сколько фиников останется после обязательных покупок.',
    baseReward: 16,
    unit: 'фиников',
    correct: 40,
    tolerance: 0,
    hint: 'Из 100 вычти 35, а потом ещё 25.',
    goodExplanation:
      'Точно: 100 − 35 − 25 = 40. Это свободные деньги. Их можно потратить на желанное или отложить.',
    softExplanation:
      'Считаем по шагам: 100 − 35 = 65, затем 65 − 25 = 40. Остаётся 40 фиников — это и есть свободные деньги.',
  },

  // Как копить
  {
    id: 'save-howmuch',
    topic: 'saving',
    kind: 'number',
    title: 'Копилка на самокат',
    situation: 'Самокат стоит 240 фиников. Финни хочет купить его за 4 недели.',
    task: 'Сколько нужно откладывать каждую неделю?',
    baseReward: 22,
    unit: 'фиников в неделю',
    correct: 60,
    tolerance: 0,
    hint: 'Раздели 240 на 4 недели.',
    goodExplanation:
      'Верно: 240 ÷ 4 = 60. Если откладывать по 60 фиников каждую неделю, через 4 недели самокат твой.',
    softExplanation:
      'Чтобы узнать, сколько откладывать, цену делят на число недель: 240 ÷ 4 = 60 фиников в неделю. Если откладывать меньше, копить придётся дольше — и это тоже нормально.',
  },
  {
    id: 'save-temptation',
    topic: 'saving',
    kind: 'choice',
    title: 'Почти накопили',
    situation:
      'В копилке 200 фиников, до самоката осталось 40. В магазине появился большой торт за 60.',
    task: 'Что сделает Финни?',
    baseReward: 20,
    options: [
      {
        id: 'wait',
        title: 'Подождать неделю и купить самокат',
        icon: 'scooter',
        good: true,
        consequence:
          'Через неделю Финни накопил и купил самокат. Торт никуда не делся — его можно съесть потом.',
        rewardDelta: 6,
        effects: { joy: 10 },
      },
      {
        id: 'cake',
        title: 'Взять торт из копилки',
        icon: 'cake',
        good: false,
        consequence:
          'Торт был вкусный, но копилка опустела до 140. До самоката снова далеко — ещё около двух недель.',
        rewardDelta: 0,
        effects: { joy: 8 },
      },
      {
        id: 'both',
        title: 'Отложить ещё и купить торт на следующей неделе',
        icon: 'calendar',
        good: true,
        consequence:
          'Финни сначала закрыл цель, а торт купил из денег следующей недели. Получилось и то, и другое.',
        rewardDelta: 8,
        effects: { joy: 6 },
      },
    ],
  },
  {
    id: 'save-basket',
    topic: 'saving',
    kind: 'basket',
    title: 'Освободить место для копилки',
    situation: 'У Финни 80 фиников. Нужно закрыть обязательное и отложить хотя бы 20.',
    task: 'Собери корзину так, чтобы осталось не меньше 20 фиников на копилку.',
    baseReward: 22,
    budget: 80,
    options: [
      { id: 'food', title: 'Каша', icon: 'bowl', price: 20, needed: true },
      { id: 'wash', title: 'Купание', icon: 'bath', price: 25, needed: true },
      { id: 'sticker', title: 'Наклейки', icon: 'star', price: 20, needed: false },
      { id: 'hat', title: 'Шапочка', icon: 'cap', price: 45, needed: false },
      { id: 'boat', title: 'Кораблик', icon: 'boat', price: 55, needed: false },
    ],
    mustHave: ['food', 'wash'],
    goodExplanation:
      'Отлично. Обязательное куплено, и на копилку осталось не меньше 20 фиников. Копить проще, когда откладываешь сразу.',
    softExplanation:
      'Каша и купание обязательны — это 45 фиников. Из 80 остаётся 35. Чтобы отложить 20, можно взять что-то одно недорогое или вообще ничего. Большие игрушки в этот раз не помещаются.',
  },

  // Покупки и оплата
  {
    id: 'shop-basket',
    topic: 'spending',
    kind: 'basket',
    title: 'Поход в магазин',
    situation: 'У Финни с собой 70 фиников.',
    task: 'Купи всё обязательное и не выйди за 70 фиников.',
    baseReward: 20,
    budget: 70,
    options: [
      { id: 'food', title: 'Обед', icon: 'salad', price: 35, needed: true },
      { id: 'water', title: 'Вода', icon: 'drop', price: 10, needed: true },
      { id: 'wash', title: 'Купание', icon: 'bath', price: 25, needed: true },
      { id: 'cake', title: 'Торт', icon: 'cake', price: 60, needed: false },
      { id: 'ball', title: 'Мячик', icon: 'ball', price: 25, needed: false },
    ],
    mustHave: ['food', 'water', 'wash'],
    goodExplanation:
      'Ты купил всё нужное и уложился в 70 фиников. Обязательные покупки всегда идут первыми.',
    softExplanation:
      'Обед, вода и купание стоят 35 + 10 + 25 = 70 фиников. Это ровно вся сумма — на торт и мячик денег в этот раз нет. Их можно купить, когда появятся свободные деньги.',
  },
  {
    id: 'shop-change',
    topic: 'spending',
    kind: 'number',
    title: 'Сколько сдачи?',
    situation: 'Финни дал в кассу 100 фиников. Покупка стоила 65.',
    task: 'Сколько фиников вернут Финни?',
    baseReward: 16,
    unit: 'фиников',
    correct: 35,
    tolerance: 0,
    hint: 'Из 100 вычти 65.',
    goodExplanation:
      'Верно: 100 − 65 = 35. Сдачу всегда стоит пересчитать сразу у кассы.',
    softExplanation:
      'Сдача — это разница между тем, что дали, и ценой: 100 − 65 = 35 фиников. Пересчитать сдачу — привычка, которая бережёт деньги.',
  },
  {
    id: 'shop-discount',
    topic: 'spending',
    kind: 'choice',
    title: 'Две по цене одной',
    situation:
      'В лавке акция: две шапочки за 80 вместо 90. Но Финни нужна только одна шапочка за 45.',
    task: 'Что выгоднее для Финни?',
    baseReward: 20,
    options: [
      {
        id: 'one',
        title: 'Купить одну шапочку за 45',
        icon: 'cap',
        good: true,
        consequence:
          'Финни потратил 45 и получил то, что нужно. Остальные 35 остались в кошельке.',
        rewardDelta: 6,
        effects: { joy: 10 },
      },
      {
        id: 'two',
        title: 'Взять две по акции за 80',
        icon: 'cap',
        good: false,
        consequence:
          'Финни потратил на 35 фиников больше, а вторая шапочка лежит без дела. Скидка выгодна, только если вещь действительно нужна.',
        rewardDelta: 0,
        effects: { joy: 4 },
      },
      {
        id: 'none',
        title: 'Не покупать сейчас',
        icon: 'hourglass',
        good: true,
        consequence:
          'Финни отложил покупку. Деньги остались целы, шапочку можно купить на следующей неделе.',
        rewardDelta: 4,
      },
    ],
  },
]

export function questById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id)
}

export const QUEST_TOPICS: QuestTopic[] = ['planning', 'saving', 'spending']
