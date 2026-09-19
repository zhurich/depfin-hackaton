import { useState } from 'react'

import { ESSENTIAL_ITEMS, OPTIONAL_ITEMS, SHOP_ITEMS } from '../content/shop'
import { QUESTS } from '../content/quests'
import { Button, Card, Money, Note, Screen, Sheet } from '../components/ui'
import { STAT_EMOJI, STAT_LABEL } from '../domain/pet'
import { boughtCount, checkPurchase, findCheaperAlternative } from '../domain/purchase'
import type { PurchaseCheck } from '../domain/purchase'
import { playSound } from '../platform/sound'
import { useGame } from '../store/gameStore'
import type { ShopItem } from '../domain/types'
import type { Route } from '../navigation'

export function ShopScreen({ go, onBack }: { go: (r: Route) => void; onBack: () => void }) {
  const { state, dispatch, activeGoal, pendingQuestIds } = useGame()
  const [selected, setSelected] = useState<ShopItem | null>(null)
  const [blocked, setBlocked] = useState<{ item: ShopItem; check: PurchaseCheck } | null>(null)
  const [justBought, setJustBought] = useState<string | null>(null)

  const averagePendingQuestReward = (() => {
    const pending = QUESTS.filter((q) => pendingQuestIds.includes(q.id))
    if (pending.length === 0) return 0
    return Math.round(pending.reduce((a, q) => a + q.baseReward, 0) / pending.length)
  })()

  const runCheck = (item: ShopItem): PurchaseCheck =>
    checkPurchase(item, {
      balance: state.balance,
      purchases: state.period.purchases,
      cheaperAlternative: findCheaperAlternative(item, SHOP_ITEMS, {
        balance: state.balance,
        purchases: state.period.purchases,
      }),
      averagePendingQuestReward,
      activeGoalSaved: activeGoal?.saved ?? 0,
    })

  const openItem = (item: ShopItem) => {
    const check = runCheck(item)
    if (!check.allowed) {
      playSound('blocked')
      setBlocked({ item, check })
      return
    }
    playSound('tap')
    setSelected(item)
  }

  const confirmBuy = () => {
    if (!selected) return
    dispatch({ type: 'buy', itemId: selected.id })
    playSound('coin')
    setJustBought(selected.title)
    setSelected(null)
  }

  return (
    <Screen title="Покупки" onBack={onBack}>
      <Card>
        <div className="row row--between">
          <span style={{ fontWeight: 700 }}>Свободные финики</span>
          <span style={{ fontSize: 22 }}>
            <Money value={state.balance} />
          </span>
        </div>
        {state.planConfirmed && state.plan && (
          <p className="muted" style={{ marginTop: 8 }}>
            По плану: нужное — {state.plan.essential} Ф (потрачено {state.period.essentialSpent}),
            желанное — {state.plan.optional} Ф (потрачено {state.period.optionalSpent}).
          </p>
        )}
      </Card>

      {justBought && (
        <Note tone="good" title="Покупка сделана">
          «{justBought}» куплено. Посмотри, как изменились показатели Финни на главном экране.
        </Note>
      )}

      <Section
        title="Сначала нужное"
        subtitle="Без этого Финни будет грустить"
        items={ESSENTIAL_ITEMS}
        onPick={openItem}
        state={state}
      />

      <Section
        title="Потом желанное"
        subtitle="Можно купить, а можно отложить — это не ошибка"
        items={OPTIONAL_ITEMS}
        onPick={openItem}
        state={state}
      />

      {state.period.purchases.length > 0 && (
        <Card>
          <h3>Что уже куплено на этой неделе</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }} className="stack stack--tight">
            {state.period.purchases.map((p, i) => (
              <li key={`${p.itemId}-${i}`} className="row row--between">
                <span>
                  <span aria-hidden="true">{p.emoji}</span> {p.title}
                  <span className={`badge badge--${p.kind}`} style={{ marginLeft: 8 }}>
                    {p.kind === 'essential' ? 'нужное' : 'желанное'}
                  </span>
                </span>
                <Money value={p.price} sign="−" />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Подтверждение покупки */}
      <Sheet open={selected !== null} onClose={() => setSelected(null)} title="Покупка">
        {selected && (
          <div className="stack">
            <div className="row">
              <span style={{ fontSize: 44 }} aria-hidden="true">
                {selected.emoji}
              </span>
              <div>
                <h3>{selected.title}</h3>
                <span className={`badge badge--${selected.kind}`}>
                  {selected.kind === 'essential' ? 'обязательный расход' : 'необязательный расход'}
                </span>
              </div>
            </div>

            <div className="row row--between">
              <span>Цена</span>
              <span style={{ fontSize: 22 }}>
                <Money value={selected.price} />
              </span>
            </div>

            <Note tone="info" title="Что изменится">
              <div className="stack stack--tight">
                <span>{selected.impact}</span>
                <span className="muted">
                  {Object.entries(selected.effects).map(([k, v]) => (
                    <span key={k} style={{ marginRight: 12 }}>
                      {STAT_EMOJI[k as keyof typeof STAT_EMOJI]}{' '}
                      {STAT_LABEL[k as keyof typeof STAT_LABEL]} +{v}
                    </span>
                  ))}
                </span>
                <span>
                  Останется: <Money value={state.balance - selected.price} />
                </span>
              </div>
            </Note>

            <Button block large onClick={confirmBuy}>
              Купить за {selected.price} Ф
            </Button>
            <Button variant="ghost" block onClick={() => setSelected(null)}>
              Пока не буду
            </Button>
          </div>
        )}
      </Sheet>

      {/* Нехватка средств: объяснение и варианты */}
      <Sheet open={blocked !== null} onClose={() => setBlocked(null)} title="Пока не получится">
        {blocked && (
          <div className="stack">
            <Note tone="warn" title={blocked.check.reason === 'limit-reached' ? 'Уже хватает' : 'Не хватает фиников'}>
              {blocked.check.message}
            </Note>

            <h3>Что можно сделать</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack stack--tight">
              {blocked.check.options.map((o) => (
                <li key={o.id}>
                  <button
                    className="item"
                    onClick={() => {
                      setBlocked(null)
                      if (o.id === 'quest') go('quests')
                      if (o.id === 'withdraw') go('savings')
                    }}
                  >
                    <span className="item__emoji" aria-hidden="true">
                      {OPTION_EMOJI[o.id]}
                    </span>
                    <span className="stack stack--tight" style={{ minWidth: 0 }}>
                      <span className="item__title">{o.label}</span>
                      <span className="muted">{o.hint}</span>
                    </span>
                    <span aria-hidden="true">{o.id === 'next-period' ? '' : '›'}</span>
                  </button>
                </li>
              ))}
            </ul>

            <Button variant="ghost" block onClick={() => setBlocked(null)}>
              Понятно
            </Button>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}

const OPTION_EMOJI: Record<string, string> = {
  quest: '🎲',
  cheaper: '🪙',
  withdraw: '🐷',
  'next-period': '📆',
}

function Section({
  title,
  subtitle,
  items,
  onPick,
  state,
}: {
  title: string
  subtitle: string
  items: ShopItem[]
  onPick: (item: ShopItem) => void
  state: ReturnType<typeof useGame>['state']
}) {
  return (
    <section className="stack">
      <div>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>
      </div>
      {items.map((item) => {
        const bought = boughtCount(state.period.purchases, item.id)
        const soldOut = bought >= item.perPeriodLimit
        const tooExpensive = item.price > state.balance
        return (
          <button
            key={item.id}
            className={`item${soldOut ? ' item--done' : ''}${tooExpensive && !soldOut ? ' item--blocked' : ''}`}
            onClick={() => onPick(item)}
          >
            <span className="item__emoji" aria-hidden="true">
              {item.emoji}
            </span>
            <span className="stack stack--tight" style={{ minWidth: 0 }}>
              <span className="item__title">
                {item.title}
                {bought > 0 && <span className="muted"> · куплено {bought}</span>}
              </span>
              <span className="muted">{item.impact}</span>
              {tooExpensive && !soldOut && (
                <span style={{ color: 'var(--c-warn)', fontSize: 15 }}>
                  ⚠ не хватает {item.price - state.balance} Ф
                </span>
              )}
              {soldOut && (
                <span style={{ color: 'var(--c-good)', fontSize: 15 }}>✓ на эту неделю хватит</span>
              )}
            </span>
            <span className="money">{item.price} Ф</span>
          </button>
        )
      })}
    </section>
  )
}
