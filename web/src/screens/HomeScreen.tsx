import { QUESTS } from '../content/quests'
import { Pet } from '../components/Pet'
import { Button, Card, Chip, Money, Note, ProgressBar, StatBar } from '../components/ui'
import { MOOD_LABEL, STAT_EMOJI, STAT_LABEL, moodOf, moodReason, stageForGrowth, stageIndex } from '../domain/pet'
import { goalProgress, goalRemaining, pluralFinik } from '../domain/savings'
import { DAILY_BONUS } from '../domain/rules'
import { canClaimBonus, useGame } from '../store/gameStore'
import type { Route } from '../navigation'

const STAT_COLOR = {
  fullness: 'var(--c-essential)',
  care: 'var(--c-savings)',
  joy: 'var(--c-optional)',
} as const

export function HomeScreen({ go }: { go: (route: Route) => void }) {
  const { state, dispatch, activeGoal, pendingQuestIds } = useGame()
  const pet = state.pet!

  const mood = moodOf(state.stats)
  const stage = stageForGrowth(state.growth)
  const nextQuest = QUESTS.find((q) => pendingQuestIds.includes(q.id))
  const bonusAvailable = canClaimBonus(state)

  return (
    <div className="screen">
      <header className="topbar">
        <div className="topbar__title">
          Неделя {state.periodIndex} · {state.playerName}
        </div>
        <Chip>
          🪙 <Money value={state.balance} />
        </Chip>
      </header>

      <main className="content">
        <Card>
          <div className="row row--between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2>{pet.name}</h2>
              <p className="muted">
                {stage.title} · {MOOD_LABEL[mood]}
              </p>
            </div>
            <Chip>⭐ {state.growth}</Chip>
          </div>

          <div className="pet-stage">
            <Pet
              look={pet}
              mood={mood}
              size={160}
              stageIndex={stageIndex(stage.id)}
              animate={state.settings.motion}
            />
          </div>

          <div className="stack stack--tight">
            {(['fullness', 'care', 'joy'] as const).map((key) => (
              <StatBar
                key={key}
                emoji={STAT_EMOJI[key]}
                label={STAT_LABEL[key]}
                value={state.stats[key]}
                color={STAT_COLOR[key]}
              />
            ))}
          </div>

          <div style={{ marginTop: 'var(--sp-3)' }}>
            <Note tone={mood === 'sad' ? 'warn' : 'good'}>{moodReason(state.stats)}</Note>
          </div>
        </Card>

        <Card>
          <div className="row row--between">
            <div>
              <p className="muted">Свободные финики</p>
              <p style={{ fontSize: 26, fontWeight: 800 }}>
                <Money value={state.balance} />
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="muted">В копилке</p>
              <p style={{ fontSize: 26, fontWeight: 800 }}>
                <Money value={activeGoal?.saved ?? 0} />
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--sp-3)' }}>
            {activeGoal ? (
              <button
                className="item"
                onClick={() => go('savings')}
                aria-label={`Цель ${activeGoal.title}, накоплено ${activeGoal.saved} из ${activeGoal.cost}`}
              >
                <span className="item__emoji" aria-hidden="true">
                  {activeGoal.emoji}
                </span>
                <span className="stack stack--tight" style={{ minWidth: 0 }}>
                  <span className="item__title">{activeGoal.title}</span>
                  <ProgressBar value={goalProgress(activeGoal)} label={activeGoal.title} />
                  <span className="muted">
                    {activeGoal.saved} из {activeGoal.cost} · осталось {goalRemaining(activeGoal)}{' '}
                    {pluralFinik(goalRemaining(activeGoal))}
                  </span>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            ) : (
              <Button variant="secondary" block onClick={() => go('savings')}>
                🎯 Выбрать цель для копилки
              </Button>
            )}
          </div>
        </Card>

        {nextQuest ? (
          <Card>
            <p className="muted">Задание недели</p>
            <button className="item" onClick={() => go('quests')} style={{ marginTop: 8 }}>
              <span className="item__emoji" aria-hidden="true">
                🎲
              </span>
              <span className="stack stack--tight" style={{ minWidth: 0 }}>
                <span className="item__title">{nextQuest.title}</span>
                <span className="muted">{nextQuest.situation}</span>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          </Card>
        ) : (
          <Note tone="good" title="Все задания пройдены">
            Ты выполнил все задания. Можно завершить неделю и посмотреть итоги.
          </Note>
        )}

        {bonusAvailable && (
          <Button
            variant="secondary"
            block
            large
            onClick={() => dispatch({ type: 'claimBonus' })}
          >
            🎁 Забрать бонус за вход: +{DAILY_BONUS} Ф
          </Button>
        )}

        <nav aria-label="Разделы игры">
          <div className="nav-grid">
            <NavButton emoji="🗂️" title="План" onClick={() => go('budget')} badge={state.planConfirmed ? undefined : '!'} />
            <NavButton emoji="🛒" title="Покупки" onClick={() => go('shop')} />
            <NavButton emoji="🐷" title="Копилка" onClick={() => go('savings')} />
            <NavButton
              emoji="🎲"
              title="Задания"
              onClick={() => go('quests')}
              badge={pendingQuestIds.length > 0 ? String(pendingQuestIds.length) : undefined}
            />
            <NavButton emoji="📈" title="Прогресс" onClick={() => go('progress')} />
            <NavButton emoji="📖" title="Словарик" onClick={() => go('glossary')} />
          </div>
        </nav>

        <Button variant="primary" block large onClick={() => go('summary')}>
          Завершить неделю {state.periodIndex} →
        </Button>

        <Button variant="ghost" block onClick={() => go('parent')}>
          👋 Раздел для взрослого
        </Button>
      </main>
    </div>
  )
}

function NavButton({
  emoji,
  title,
  onClick,
  badge,
}: {
  emoji: string
  title: string
  onClick: () => void
  badge?: string
}) {
  return (
    <button className="nav-btn" onClick={onClick}>
      <span className="nav-btn__emoji" aria-hidden="true">
        {emoji}
      </span>
      <span>{title}</span>
      {badge && (
        <span className="nav-btn__badge" aria-label={`Требует внимания: ${badge}`}>
          {badge}
        </span>
      )}
    </button>
  )
}
