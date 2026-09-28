// Ответ барьера вводится числом: выбор из трёх вариантов ребёнок подбирает перебором.
import { useMemo, useState } from 'react'

import { QUESTS, QUEST_TOPICS, TOPIC_TITLES } from '../content/quests'
import { STAGES } from '../content/appearance'
import { Icon } from '../components/Icon'
import { Button, Card, ConfirmSheet, Money, Note, ScreenHead } from '../components/ui'
import { stageForGrowth } from '../domain/pet'
import {
  DEMO_PERIODS,
  PARENT_BONUS_PER_PERIOD_LIMIT,
  PARENT_BONUS_STEP,
} from '../domain/rules'
import { getAppInfo, requestNativeWipe, type Platform } from '../platform/bridge'
import { storageAvailable, storageKind } from '../platform/storage'
import { setSoundEnabled } from '../platform/sound'
import { useGame, wipeLocalProfile } from '../store/gameStore'
import type { IconName, Settings } from '../domain/types'

export function ParentScreen() {
  const [unlocked, setUnlocked] = useState(false)
  return unlocked ? <ParentPanel /> : <Gate onPass={() => setUnlocked(true)} />
}

const PLATFORM_LABEL: Record<Platform, string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'браузер',
}

const STORAGE_LABEL: Record<'native' | 'browser', string> = {
  native: 'в приложении',
  browser: 'в хранилище браузера',
}

// Барьер

function Gate({ onPass }: { onPass: () => void }) {
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
    <>
      <ScreenHead title="Раздел для взрослого" sub="Здесь настройки, прогресс и удаление данных." />

      <div
        style={{
          background: 'var(--brand)',
          color: '#fff',
          borderRadius: 'var(--r-lg)',
          padding: 22,
          textAlign: 'center',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, opacity: 0.75 }}>Проверка для взрослого</div>
        <div className="num" style={{ fontSize: 34, marginTop: 6 }}>
          {task.a} × {task.b} = ?
        </div>
        <div style={{ marginTop: 16 }}>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setWrong(false)
            }}
            style={{ fontSize: 26, textAlign: 'center' }}
            aria-label="Ответ на пример"
          />
        </div>
        {wrong && (
          <div style={{ color: 'var(--sun)', fontWeight: 700, marginTop: 12 }} role="alert">
            Не сходится. Попробуйте ещё раз.
          </div>
        )}
      </div>

      <Button block disabled={value.trim() === ''} onClick={check}>
        Войти
      </Button>
    </>
  )
}

// Панель взрослого

function ParentPanel() {
  const { state, dispatch } = useGame()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const info = useMemo(getAppInfo, [])
  const storeOk = useMemo(storageAvailable, [])
  const storeKind = useMemo(storageKind, [])

  const stage = stageForGrowth(state.growth)
  const doneQuests = Object.keys(state.quests).length
  const toggle = (patch: Partial<Settings>) => dispatch({ type: 'settings', patch })

  return (
    <>
      {/* Зачем это приложение */}
      <Card>
        <h2>Чему учит игра</h2>
        <ul style={{ margin: '10px 0 0', paddingLeft: 20 }} className="stack stack--tight">
          <li>Понимать, что расходы не должны превышать доходы.</li>
          <li>Различать обязательные и необязательные расходы.</li>
          <li>Планировать покупки при ограниченном бюджете.</li>
          <li>Ставить короткую цель и регулярно откладывать часть средств.</li>
          <li>Оценивать свои решения и объяснять, к чему они привели.</li>
        </ul>
      </Card>

      <Note tone="info">
        В игре нет реальных денег, рекламы, платных подписок и сбора персональных данных.
        Внутриигровые финики нельзя купить и нельзя обменять.
      </Note>

      {/* Прогресс без оценок */}
      <Card>
        <h2>Что уже освоено</h2>
        <div className="stack stack--tight" style={{ marginTop: 10 }}>
          <Row label="Игровых недель пройдено" value={String(state.history.length)} />
          <Row label="Стадия питомца" value={stage.title} />
          <Row label="Заданий выполнено" value={`${doneQuests} из ${QUESTS.length}`} />
          <Row label="Недель подряд с пополнением копилки" value={String(state.savingStreak)} />
        </div>

        <h3 style={{ marginTop: 18 }}>Пройденные темы</h3>
        <div className="stack stack--tight" style={{ marginTop: 8 }}>
          {QUEST_TOPICS.map((topic) => {
            const all = QUESTS.filter((q) => q.topic === topic)
            const done = all.filter((q) => state.quests[q.id]).length
            return <Row key={topic} label={TOPIC_TITLES[topic]} value={`${done} из ${all.length}`} />
          })}
        </div>
      </Card>

      <Note tone="hint">
        Это описание опыта, а не оценка. Задание, решённое не с первого раза, тоже засчитывается:
        ребёнок получает разбор и продолжает игру.
      </Note>

      {/* Баллы от взрослого */}
      <Card>
        <h2>Поощрить ребёнка</h2>
        <p className="muted" style={{ margin: '6px 0 12px' }}>
          Можно начислить игровые финики за дело в реальной жизни. Не больше{' '}
          {PARENT_BONUS_PER_PERIOD_LIMIT} Ф за неделю, чтобы бонусы не заменяли планирование.
        </p>
        <div className="stack stack--tight">
          <Row
            label="Начислено за эту неделю"
            value={`${state.period.parentBonusThisPeriod} из ${PARENT_BONUS_PER_PERIOD_LIMIT} Ф`}
          />
          <Row label="Начислено всего" value={`${state.parentBonusTotal} Ф`} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Button
            variant="good"
            block
            icon="coin"
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
        <div className="stack" style={{ marginTop: 10 }}>
          <Toggle
            icon="sound"
            label="Звуки"
            hint="Звук только дублирует то, что написано на экране."
            checked={state.settings.sound}
            onChange={(v) => {
              toggle({ sound: v })
              setSoundEnabled(v)
            }}
          />
          <Toggle
            icon="motion"
            label="Анимации"
            hint="Выключите, если движение отвлекает."
            checked={state.settings.motion}
            onChange={(v) => toggle({ motion: v })}
          />
          <Toggle
            icon="calendar"
            label="Демонстрационный режим"
            hint={`Все задания открыты сразу, бонус не ждёт календарного дня. Для показа ${DEMO_PERIODS} недель подряд.`}
            checked={state.settings.demoMode}
            onChange={(v) => toggle({ demoMode: v })}
          />
        </div>
      </Card>

      {/* Данные */}
      <Card>
        <h2>Данные на устройстве</h2>
        <p className="muted" style={{ margin: '6px 0 12px' }}>
          Профиль хранится только здесь и никуда не передаётся. Ни имя, ни телефон, ни почта не
          собираются.
        </p>
        <div className="stack stack--tight">
          <Row label="Хранилище доступно" value={storeOk ? 'да' : 'нет'} />
          <Row label="Где хранится профиль" value={STORAGE_LABEL[storeKind]} />
          <Row label="Платформа" value={PLATFORM_LABEL[info.platform]} />
          <Row label="Версия приложения" value={`${info.versionName} (${info.versionCode})`} />
          <Row label="Пакет" value={info.packageName} />
        </div>

        <div className="stack" style={{ marginTop: 16 }}>
          <Button variant="quiet" block icon="refresh" onClick={() => setConfirmReset(true)}>
            Сбросить профиль к началу
          </Button>
          <Button variant="danger" block icon="trash" onClick={() => setConfirmDelete(true)}>
            Удалить все данные
          </Button>
        </div>
      </Card>

      <p className="muted">
        Стадий развития питомца: {STAGES.length}. Развитие зависит от того, закрыты ли обязательные
        расходы, совпал ли факт с планом и пополнялась ли копилка.
      </p>

      <ConfirmSheet
        open={confirmReset}
        title="Сбросить профиль?"
        tone="hint"
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
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="row row--between">
      <span className="muted">{label}</span>
      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function Toggle({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: IconName
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
      className="row-btn"
    >
      <span
        className="glyph"
        style={{ background: checked ? 'var(--need-wash)' : 'var(--neutral)' }}
        aria-hidden="true"
      >
        <Icon name={icon} color={checked ? 'var(--need)' : 'var(--ink-soft)'} />
      </span>
      <span className="row-btn__body">
        <span className="row-btn__title">{label}</span>
        <span className="row-btn__sub">{hint}</span>
      </span>
      <span
        className="tag"
        style={{
          background: checked ? 'var(--need-wash)' : 'var(--neutral)',
          color: checked ? 'var(--need-deep)' : 'var(--ink-soft)',
        }}
      >
        <Icon name={checked ? 'check' : 'close'} size={14} width={3} />
        {checked ? 'вкл' : 'выкл'}
      </span>
    </button>
  )
}
