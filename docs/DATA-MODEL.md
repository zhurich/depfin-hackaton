# Структура данных

Раздел 5, пункт 4 ТЗ: структура данных профиля, игровой экономики, заданий и
прогресса.

Определения типов: [`web/src/domain/types.ts`](../web/src/domain/types.ts).

---

## Где хранится

| Что | Где | Ключ |
| --- | --- | --- |
| Весь профиль | `localStorage` внутри WebView | `finni.profile.v1` |

Один JSON-документ, единицы килобайт. Данные не покидают устройство.

Версия схемы — поле `schemaVersion`. При загрузке
[`migrate()`](../web/src/domain/state.ts) дозаполняет отсутствующие поля
значениями по умолчанию: профиль от более старой сборки не роняет приложение.

---

## Профиль целиком

```ts
interface GameState {
  schemaVersion: number        // версия схемы, сейчас 1
  onboardingDone: boolean      // знакомство пройдено
  playerName: string           // ИГРОВОЕ имя ребёнка (не настоящее)
  pet: PetProfile | null       // питомец; null до создания

  balance: number              // свободные финики
  stats: PetStats              // состояние питомца
  growth: number               // накопленные очки роста

  goals: Goal[]                // все цели, включая созданные ребёнком
  activeGoalId: string | null  // выбранная цель

  periodIndex: number          // номер текущей игровой недели, с 1
  plan: BudgetPlan | null      // план на текущую неделю
  planConfirmed: boolean       // план подтверждён
  period: PeriodProgress       // что происходит внутри текущей недели

  lastBonusDate: string | null // ГГГГ-ММ-ДД последнего бонуса за вход
  ledger: LedgerEntry[]        // журнал всех операций
  quests: Record<string, QuestResult>  // выполненные задания
  history: PeriodSummary[]     // итоги закрытых недель, новые первыми
  savingStreak: number         // недель подряд с пополнением копилки

  settings: Settings
  parentBonusTotal: number     // всего начислено взрослым
  createdAt: number
  updatedAt: number
}
```

---

## Питомец

```ts
interface PetProfile {
  name: string        // игровое имя питомца
  speciesId: string   // 'fox' | 'cat' | 'bunny' | 'dragon'
  paletteId: string   // 'orange' | 'mint' | 'lilac' | 'sky' | 'sand'
  accessoryId: string // 'none' | 'scarf' | 'cap' | 'glasses'
}

interface PetStats {
  fullness: number  // сытость, 0…100
  care: number      // уход,    0…100
  joy: number       // радость, 0…100
}
```

Внешний вид хранится как три идентификатора, а не как изображение: комбинаций
4 × 5 × 4 = **80**, и каждая занимает несколько десятков байт. Рисует их
[`Pet.tsx`](../web/src/components/Pet.tsx) векторно.

Стадия развития в профиле не хранится — она вычисляется из `growth` функцией
`stageForGrowth()`. Так исключено расхождение между очками и стадией.

---

## Бюджет периода

```ts
interface BudgetPlan {
  essential: number  // обязательные расходы
  optional: number   // необязательные расходы
  savings: number    // накопления
}

interface PeriodProgress {
  income: number                // всего получено за период
  essentialSpent: number        // факт по обязательным
  optionalSpent: number         // факт по необязательным
  savedThisPeriod: number       // факт по накоплениям
  purchases: PurchaseEntry[]    // история покупок периода
  questsDone: string[]          // задания, выполненные в этом периоде
  bonusesTaken: number          // взято бонусов за вход
  parentBonusThisPeriod: number // начислено взрослым в этом периоде
}
```

`essentialSpent` и `optionalSpent` — производные от `purchases`, они
пересчитываются функцией `spentByKind()` при каждой покупке. Это упрощает чтение
на экранах и исключает расхождение истории с суммами.

---

## Журнал операций

```ts
interface LedgerEntry {
  id: string
  periodIndex: number
  kind: 'income' | 'essential' | 'optional' | 'save' | 'withdraw'
  source: string   // источник или назначение простыми словами
  amount: number   // всегда положительное; знак определяет kind
  at: number
}
```

Журнал обеспечивает требование ТЗ п. 2.5.4: баланс не меняется без объяснения.
По нему же считается средняя сумма регулярного пополнения для прогноза срока
цели.

---

## Цели

```ts
interface Goal {
  id: string
  title: string
  emoji: string
  cost: number
  caption: string
  custom: boolean              // создана ребёнком из конструктора
  saved: number                // накоплено именно на эту цель
  achievedAtPeriod: number | null
}
```

Накопления хранятся **по каждой цели отдельно**, а не общей суммой: при смене
цели прогресс прежней не теряется.

---

## Задания

Сами задания — это контент, а не состояние профиля
([`content/quests.ts`](../web/src/content/quests.ts)). В профиле хранится только
результат:

```ts
interface QuestResult {
  questId: string
  good: boolean        // решение засчитано как разумное
  reward: number       // сколько начислено
  periodIndex: number  // на какой неделе выполнено
  at: number
}
```

Структура задания зависит от вида (`kind`) — это размеченное объединение:

| Вид | Ключевые поля |
| --- | --- |
| `allocate` | `amount`, `lanes[]`, `rules[]` (минимумы по направлениям) |
| `basket` | `budget`, `options[]`, `mustHave[]` |
| `order` | `items[]`, `correctOrder[]` |
| `number` | `correct`, `tolerance`, `unit`, `hint` |
| `choice` | `options[]` с полями `good`, `consequence`, `effects` |

Общие для всех: `id`, `topic`, `title`, `situation`, `task`, `baseReward`.

---

## Итоги периода

```ts
interface PeriodSummary {
  index: number
  income: number
  plan: BudgetPlan
  fact: { essential: number; optional: number; savings: number }
  needsCovered: boolean    // обязательные нужды закрыты
  planKept: boolean        // факт уложился в план
  savedAsPlanned: boolean  // отложено не меньше плана
  growthGained: number     // начислено очков роста
  stageIdAfter: string     // стадия после закрытия периода
  notes: string[]          // «что изменилось и почему»
  nextStep: string         // путь восстановления
}
```

История хранится целиком: на экране «Прогресс» видны все закрытые недели, а не
только последняя.

---

## Настройки

```ts
interface Settings {
  sound: boolean     // звуковые отклики
  motion: boolean    // анимации
  demoMode: boolean  // демонстрационный режим для экспертной проверки
}
```

---

## Чего в структуре нет

Сознательно отсутствуют: настоящее имя, фамилия, возраст, дата рождения, пол,
телефон, e-mail, адрес, идентификаторы устройства и рекламные идентификаторы,
любые платёжные данные, сведения о семейном бюджете, геолокация, контакты.

Подробнее — [PRIVACY-PERMISSIONS.md](PRIVACY-PERMISSIONS.md).
