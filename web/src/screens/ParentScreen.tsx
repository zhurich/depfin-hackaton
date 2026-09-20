import { useMemo, useState } from 'react'

import { QUESTS, QUEST_TOPICS, TOPIC_TITLES } from '../content/quests'
import { STAGES } from '../content/appearance'
import { Button, Card, ConfirmSheet, Money, Note, Screen } from '../components/ui'
import { stageForGrowth } from '../domain/pet'
import {
  DEMO_PERIODS,
  PARENT_BONUS_PER_PERIOD_LIMIT,
  PARENT_BONUS_STEP,
} from '../domain/rules'
import { getAppInfo, requestNativeWipe } from '../platform/bridge'
import { storageAvailable } from '../platform/storage'
import { setSoundEnabled } from '../platform/sound'
import { useGame, wipeLocalProfile } from '../store/gameStore'
import type { Settings } from '../domain/types'

export function ParentScreen({ onBack }: { onBack: () => void }) {
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) return <Gate onPass={() => setUnlocked(true)} onBack={onBack} />
  return <ParentPanel onBack={onBack} />
}

// Барьер

function Gate({ onPass, onBack }: { onPass: () => void; onBack: () => void }) {
  const task = useMemo(() => {
    const a = 6 + Math.floor(Math.random() * 7) // 6..12
    const b = 7 + Math.floor(Math.random() * 6) // 7..12
    return { a, b, answer: a * b }
  }, [])

  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)

  const check = () => {
    if (Number(value) === task.answer) onPass()
    else {
      setWrong(true)
      setValue('')
    }
  }

  return (
    <Screen title="Раздел для взрослого" onBack={onBack}>
      <Note tone="info" title="Этот раздел — для родителя">
        Здесь настройки, прогресс и удаление данных. Чтобы войти, решите пример.
      </Note>

      <Card>
        <div className="stack">
          <p style={{ fontSize: 28, textAlign: 'center', fontWeight: 800 }}>
            {task.a} × {task.b} = ?
          </p>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setWrong(false)
            }}
            style={{ fontSize: 24, textAlign: 'center' }}
            aria-label="Ответ на пример"
          />
          {wrong && <Note tone="warn">Не сходится. Попробуйте ещё раз.</Note>}
          <Button block large onClick={check} disabled={value.trim() === ''}>
            Войти
          </Button>
        </div>
      </Card>
    </Screen>
  )
}

// Панель взрослого

function ParentPanel({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useGame()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const info = useMemo(getAppInfo, [])
  const storeOk = useMemo(storageAvailable, [])

  const stage = stageForGrowth(state.growth)
  const doneQuests = Object.keys(state.quests).length

  const toggle = (patch: Partial<Settings>) => dispatch({ type: 'settings', patch })

  return (
    <Screen title="Раздел для взрослого" onBack={onBack}>
      <Card>
        <h2>Чему учит игра</h2>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }} className="stack stack--tight">
          <li>Понимать, что расходы не должны превышать доходы.</li>
          <li>Различать обязательные и необязательные расходы.</li>
          <li>Планировать покупки при ограниченном бюджете.</li>
          <li>Ставить короткую цель и регулярно откладывать часть средств.</li>
          <li>Оценивать свои решения и объяснять, к чему они привели.</li>
        </ul>
        <Note tone="info">
          В игре нет реальных денег, рекламы, платных подписок и сбора персональных данных.
          Внутриигровые финики нельзя купить и нельзя обменять.
        </Note>
      </Card>

      <Card>
        <h2>Что уже освоено</h2>
        <div className="stack stack--tight" style={{ marginTop: 8 }}>
          <Row label="Игровых недель пройдено" value={String(state.history.length)} />
          <Row label="Стадия питомца" value={stage.title} />
          <Row label="Заданий выполнено" value={`${doneQuests} из ${QUESTS.length}`} />
          <Row
            label="Недель подряд с пополнением копилки"
            value={String(state.savingStreak)}
          />
        </div>

        <h3 style={{ marginTop: 'var(--sp-4)' }}>Пройденные темы</h3>
        <div className="stack stack--tight" style={{ marginTop: 8 }}>
          {QUEST_TOPICS.map((topic) => {
            const all = QUESTS.filter((q) => q.topic === topic)
            const done = all.filter((q) => state.quests[q.id]).length
            return (
              <Row key={topic} label={TOPIC_TITLES[topic]} value={`${done} из ${all.length}`} />
            )
          })}
        </div>

        <Note tone="info">
          Это описание опыта, а не оценка. Задание, решённое не с первого раза, тоже засчитывается:
          ребёнок получает разбор и продолжает игру.
        </Note>
      </Card>

      {/* Баллы от взрослого */}
      <Card>
        <h2>Поощрить ребёнка</h2>
        <p className="muted" style={{ margin: '4px 0 12px' }}>
          Можно начислить игровые финики за дело в реальной жизни — например, за помощь по дому.
          Не больше {PARENT_BONUS_PER_PERIOD_LIMIT} Ф за неделю, чтобы бонусы не заменяли
          планирование.
        </p>
        <Row
          label="Начислено за эту неделю"
          value={`${state.period.parentBonusThisPeriod} из ${PARENT_BONUS_PER_PERIOD_LIMIT} Ф`}
        />
        <Row label="Начислено всего" value={`${state.parentBonusTotal} Ф`} />
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <Button
            block
            disabled={state.period.parentBonusThisPeriod >= PARENT_BONUS_PER_PERIOD_LIMIT}
            onClick={() => dispatch({ type: 'parentBonus' })}
          >
            Начислить <Money value={PARENT_BONUS_STEP} sign="+" />
          </Button>
        </div>
      </Card>

      {/* Настройки */}
      <Card>
        <h2>Настройки</h2>
        <div className="stack" style={{ marginTop: 8 }}>
          <Toggle
            label="Звуки"
            hint="Звук только дублирует то, что написано на экране."
            checked={state.settings.sound}
            onChange={(v) => {
              toggle({ sound: v })
              setSoundEnabled(v)
            }}
          />
          <Toggle
            label="Анимации"
            hint="Выключите, если движение отвлекает."
            checked={state.settings.motion}
            onChange={(v) => toggle({ motion: v })}
          />
          <Toggle
            label="Демонстрационный режим"
            hint={`Все задания открыты сразу, бонусы не ждут календарного дня. Для показа ${DEMO_PERIODS} недель подряд.`}
            checked={state.settings.demoMode}
            onChange={(v) => toggle({ demoMode: v })}
          />
        </div>
      </Card>

      {/* Данные */}
      <Card>
        <h2>Данные на устройстве</h2>
        <p className="muted" style={{ margin: '4px 0 12px' }}>
          Профиль хранится только здесь и никуда не передаётся. Ни имя, ни телефон, ни почта не
          собираются.
        </p>
        <Row label="Хранилище доступно" value={storeOk ? 'да' : 'нет'} />
        <Row label="Версия приложения" value={`${info.versionName} (${info.versionCode})`} />
        <Row label="Пакет" value={info.packageName} />

        <div className="stack" style={{ marginTop: 'var(--sp-4)' }}>
          <Button variant="secondary" block onClick={() => setConfirmReset(true)}>
            ↺ Сбросить профиль к началу
          </Button>
          <Button variant="danger" block onClick={() => setConfirmDelete(true)}>
            🗑 Удалить все данные
          </Button>
        </div>
      </Card>

      <ConfirmSheet
        open={confirmReset}
        title="Сбросить профиль?"
        tone="warn"
        details="Игра начнётся заново: питомец, финики, копилка и задания вернутся к исходному состоянию. Настройки сохранятся."
        confirmLabel="Да, сбросить"
        onConfirm={() => {
          dispatch({ type: 'resetProfile' })
          setConfirmReset(false)
        }}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmSheet
        open={confirmDelete}
        title="Удалить все данные?"
        tone="danger"
        details="Профиль будет стёрт с устройства полностью и без возможности восстановить. Приложение вернётся к первому запуску."
        confirmLabel="Да, удалить"
        cancelLabel="Отмена"
        onConfirm={() => {
          wipeLocalProfile(dispatch)
          requestNativeWipe()
          setConfirmDelete(false)
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <p className="muted">
        Стадий развития питомца: {STAGES.length}. Развитие зависит от того, закрыты ли обязательные
        расходы, совпал ли факт с планом и пополнялась ли копилка.
      </p>
    </Screen>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="row row--between">
      <span className="muted">{label}</span>
      <span style={{ fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="item"
      style={{ gridTemplateColumns: '1fr auto' }}
    >
      <span className="stack stack--tight" style={{ minWidth: 0 }}>
        <span className="item__title">{label}</span>
        <span className="muted">{hint}</span>
      </span>
      <span style={{ fontWeight: 700 }}>
        {checked ? '✅ вкл' : '⬜ выкл'}
      </span>
    </button>
  )
}
