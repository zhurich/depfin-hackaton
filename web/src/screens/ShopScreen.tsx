import { useState } from 'react'

import { ESSENTIAL_ITEMS, OPTIONAL_ITEMS, SHOP_ITEMS } from '../content/shop'
import { QUESTS } from '../content/quests'
import { Icon } from '../components/Icon'
import {
  Button,
  Card,
  Glyph,
  Money,
  Note,
  RowButton,
  ScreenHead,
  Sheet,
} from '../components/ui'
import { STAT_ICON, STAT_LABEL } from '../domain/pet'
import { boughtCount, checkPurchase, findCheaperAlternative } from '../domain/purchase'
import type { PurchaseCheck } from '../domain/purchase'
import { playSound } from '../platform/sound'
import { useGame } from '../store/gameStore'
import type { ExpenseKind, IconName, ShopItem } from '../domain/types'
import type { Route } from '../navigation'

const KIND_THEME: Record<ExpenseKind, { ink: string; wash: string; label: string }> = {
  essential: { ink: 'var(--need)', wash: 'var(--need-wash)', label: 'обязательный расход' },
  optional: { ink: 'var(--want)', wash: 'var(--want-wash)', label: 'необязательный расход' },
}

const OPTION_ICON: Record<string, IconName> = {
  quest: 'star',
  cheaper: 'coin',
  withdraw: 'jar',
  'next-period': 'calendar',
}

export function ShopScreen({ go }: { go: (r: Route) => void }) {
  const { state, dispatch, activeGoal, pendingQuestIds } = useGame()
  const [selected, setSelected] = useState<ShopItem | null>(null)
  const [blocked, setBlocked] = useState<{ item: ShopItem; check: PurchaseCheck } | null>(null)
  const [justBought, setJustBought] = useState<string | null>(null)

  const averagePendingQuestReward = (() => {
    const pending = QUESTS.filter((q) => pendingQuestIds.includes(q.id))
    if (pending.length === 0) return 0
    return Math.round(pending.reduce((a, q) => a + q.baseReward, 0) / pending.length)
  })()

  const openItem = (item: ShopItem) => {
    const check = checkPurchase(item, {
      balance: state.balance,
      purchases: state.period.purchases,
      cheaperAlternative: findCheaperAlternative(item, SHOP_ITEMS, {
        balance: state.balance,
        purchases: state.period.purchases,
      }),
      averagePendingQuestReward,
      activeGoalSaved: activeGoal?.saved ?? 0,
    })
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
    <>
      <ScreenHead
        title="Покупки"
        sub={
          state.planConfirmed && state.plan
            ? `По плану: нужное — ${state.plan.essential} Ф (потрачено ${state.period.essentialSpent}), желанное — ${state.plan.optional} Ф (потрачено ${state.period.optionalSpent}).`
            : 'Сначала составь план — тогда будет видно, сколько можно тратить.'
        }
      />

      {justBought && (
        <Note tone="good" title="Покупка сделана">
          «{justBought}» куплено. Посмотри, как изменились показатели Финни.
        </Note>
      )}

      <Section
        icon="check"
        theme={KIND_THEME.essential}
        title="Сначала нужное"
        items={ESSENTIAL_ITEMS}
        onPick={openItem}
      />
      <Section
        icon="plus"
        theme={KIND_THEME.optional}
        title="Потом желанное"
        items={OPTIONAL_ITEMS}
        onPick={openItem}
      />

      {state.period.purchases.length > 0 && (
        <Card>
          <h3>Куплено на этой неделе</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }} className="stack stack--tight">
            {state.period.purchases.map((p, i) => (
              <li key={`${p.itemId}-${i}`} className="row row--between">
                <span className="row" style={{ gap: 8, minWidth: 0 }}>
                  <Icon name={p.icon} color={KIND_THEME[p.kind].ink} size={20} />
                  {p.title}
                  <span className={`tag tag--${p.kind === 'essential' ? 'need' : 'want'}`}>
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
          <>
            <div className="row">
              <Glyph
                name={selected.icon}
                wash={KIND_THEME[selected.kind].wash}
                color={KIND_THEME[selected.kind].ink}
                ink
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20 }}>
                  {selected.title}
                </span>
                <span className={`tag tag--${selected.kind === 'essential' ? 'need' : 'want'}`}>
                  {KIND_THEME[selected.kind].label}
                </span>
              </span>
              <span className="num" style={{ fontSize: 22 }}>
                {selected.price} Ф
              </span>
            </div>

            <Card flat>
              <div className="stack stack--tight">
                <span>{selected.impact}</span>
                <span className="row row--wrap muted" style={{ gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(selected.effects).map(([k, v]) => (
                    <span key={k} className="row" style={{ gap: 5 }}>
                      <Icon name={STAT_ICON[k as keyof typeof STAT_ICON]} size={18} />
                      {STAT_LABEL[k as keyof typeof STAT_LABEL]} +{v}
                    </span>
                  ))}
                </span>
                <span>
                  Останется: <Money value={state.balance - selected.price} />
                </span>
              </div>
            </Card>

            <Button variant="good" block onClick={confirmBuy}>
              Купить за {selected.price} Ф
            </Button>
            <Button variant="quiet" block onClick={() => setSelected(null)}>
              Пока не буду
            </Button>
          </>
        )}
      </Sheet>

      {/* Нехватка средств: объяснение и варианты */}
      <Sheet open={blocked !== null} onClose={() => setBlocked(null)} title="Пока не получится">
        {blocked && (
          <>
            <Note
              tone="hint"
              title={blocked.check.reason === 'limit-reached' ? 'Уже хватает' : 'Не хватает фиников'}
            >
              {blocked.check.message}
            </Note>

            <h3>Что можно сделать</h3>
            <div className="stack stack--tight">
              {blocked.check.options.map((o) => (
                <RowButton
                  key={o.id}
                  icon={OPTION_ICON[o.id]}
                  wash="var(--brand-wash)"
                  color="var(--brand)"
                  title={o.label}
                  sub={o.hint}
                  right={o.id === 'next-period' ? undefined : <Icon name="chevron" size={20} />}
                  onClick={() => {
                    setBlocked(null)
                    if (o.id === 'quest') go('quests')
                    if (o.id === 'withdraw') go('savings')
                  }}
                />
              ))}
            </div>

            <Button variant="quiet" block onClick={() => setBlocked(null)}>
              Понятно
            </Button>
          </>
        )}
      </Sheet>
    </>
  )
}

function Section({
  icon,
  theme,
  title,
  items,
  onPick,
}: {
  icon: IconName
  theme: { ink: string; wash: string }
  title: string
  items: ShopItem[]
  onPick: (item: ShopItem) => void
}) {
  const { state } = useGame()
  return (
    <section className="stack">
      <div className="row" style={{ gap: 9 }}>
        <Glyph name={icon} wash={theme.wash} color={theme.ink} size="sm" />
        <h2 style={{ fontSize: 19 }}>{title}</h2>
      </div>

      {items.map((item) => {
        const bought = boughtCount(state.period.purchases, item.id)
        const soldOut = bought >= item.perPeriodLimit
        const short = item.price - state.balance
        return (
          <RowButton
            key={item.id}
            icon={item.icon}
            wash={theme.wash}
            color={theme.ink}
            title={
              <>
                {item.title}
                {bought > 0 && <span className="muted"> · куплено {bought}</span>}
              </>
            }
            sub={item.impact}
            note={soldOut ? 'на эту неделю хватит' : short > 0 ? `не хватает ${short} Ф` : undefined}
            noteColor={soldOut ? 'var(--need-deep)' : 'var(--warn-ink)'}
            dim={soldOut || short > 0}
            right={<span className="row-btn__price">{item.price} Ф</span>}
            onClick={() => onPick(item)}
          />
        )
      })}
    </section>
  )
}
