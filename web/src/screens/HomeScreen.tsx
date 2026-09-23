import { QUESTS } from '../content/quests'
import { Pet } from '../components/Pet'
import { Icon } from '../components/Icon'
import {
  Button,
  Card,
  Money,
  Note,
  ProgressBar,
  Speech,
  StatBar,
  StatTile,
} from '../components/ui'
import { paletteById } from '../content/appearance'
import {
  MOOD_LABEL,
  STAT_COLOR,
  STAT_ICON,
  STAT_LABEL,
  moodOf,
  moodReason,
  stageForGrowth,
  stageIndex,
} from '../domain/pet'
import { goalProgress, goalRemaining, pluralFinik } from '../domain/savings'
import { DAILY_BONUS } from '../domain/rules'
import { canClaimBonus, useGame } from '../store/gameStore'
import type { Route } from '../navigation'

export function HomeScreen({ go }: { go: (route: Route) => void }) {
  const { state, dispatch, activeGoal, pendingQuestIds } = useGame()
  const pet = state.pet!

  const mood = moodOf(state.stats)
  const stage = stageForGrowth(state.growth)
  const palette = paletteById(pet.paletteId)
  const nextQuest = QUESTS.find((q) => pendingQuestIds.includes(q.id))

  return (
    <>
      {/* Питомец */}
      <Card tone="cream" style={{ padding: '16px 16px 0', position: 'relative', overflow: 'hidden' }}>
        <div className="row row--between row--top" style={{ position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 24, lineHeight: 1.1 }}>
              {pet.name}
            </div>
            <div className="muted" style={{ marginTop: 3 }}>
              {stage.title} · {MOOD_LABEL[mood]}
            </div>
          </div>
          <span
            className="row"
            style={{
              gap: 6,
              background: '#fff',
              border: '2px solid var(--cream-border)',
              borderRadius: 999,
              padding: '5px 12px 5px 8px',
            }}
            aria-label={`Очки роста: ${state.growth}`}
          >
            <span
              style={{
                width: 9,
                height: 9,
                background: 'var(--sun)',
                border: '2px solid var(--ink)',
                transform: 'rotate(45deg)',
                display: 'block',
              }}
              aria-hidden="true"
            />
            <span className="num" style={{ fontSize: 15 }}>
              {state.growth}
            </span>
          </span>
        </div>

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-20%',
            right: '-20%',
            bottom: 0,
            height: 120,
            background: '#FFE0B3',
            borderRadius: '50% 50% 0 0',
          }}
        />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
          <Pet
            look={pet}
            mood={mood}
            size={190}
            stageIndex={stageIndex(stage.id)}
            animate={state.settings.motion}
          />
        </div>
      </Card>

      {/* Показатели состояния */}
      <Card>
        <div className="stack">
          {(['fullness', 'care', 'joy'] as const).map((key) => (
            <StatBar
              key={key}
              icon={STAT_ICON[key]}
              label={STAT_LABEL[key]}
              value={state.stats[key]}
              color={STAT_COLOR[key].ink}
              wash={STAT_COLOR[key].wash}
            />
          ))}
        </div>
      </Card>

      <Speech color={palette.body}>{moodReason(state.stats)}</Speech>

      {/* Деньги */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatTile label="Свободно" value={state.balance} />
        <StatTile label="В копилке" value={activeGoal?.saved ?? 0} color="var(--save-deep)" />
      </div>

      {/* Цель */}
      {activeGoal ? (
        <button
          className="row-btn"
          onClick={() => go('savings')}
          style={{
            background: 'var(--save-wash)',
            borderColor: 'var(--save-border)',
            boxShadow: '0 5px 0 var(--save-border)',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 10,
          }}
          aria-label={`Цель ${activeGoal.title}: накоплено ${activeGoal.saved} из ${activeGoal.cost}`}
        >
          <span className="row">
            <span className="glyph" style={{ background: 'var(--save)' }} aria-hidden="true">
              <Icon name={activeGoal.icon} color="#fff" />
            </span>
            <span className="row-btn__body">
              <span className="row-btn__title">{activeGoal.title}</span>
              <span className="row-btn__sub" style={{ color: 'var(--save-ink)' }}>
                осталось {goalRemaining(activeGoal)} {pluralFinik(goalRemaining(activeGoal))}
              </span>
            </span>
            <span className="num" style={{ fontSize: 19, color: 'var(--save-deep)' }}>
              {Math.round(goalProgress(activeGoal) * 100)}%
            </span>
          </span>
          <ProgressBar value={goalProgress(activeGoal)} label={activeGoal.title} pattern="dots" />
        </button>
      ) : (
        <Button variant="save" block icon="target" onClick={() => go('savings')}>
          Выбрать цель для копилки
        </Button>
      )}

      {/* Активное задание */}
      {nextQuest ? (
        <button
          className="row-btn"
          onClick={() => go('quests')}
          style={{
            background: 'var(--cream)',
            border: '2px dashed var(--cream-border)',
            boxShadow: 'none',
          }}
        >
          <span className="glyph glyph--ink" style={{ background: 'var(--sun)' }} aria-hidden="true">
            <Icon name="star" color="var(--ink)" />
          </span>
          <span className="row-btn__body">
            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: 'var(--sun-ink)',
                textTransform: 'uppercase',
                letterSpacing: '.6px',
              }}
            >
              Задание недели
            </span>
            <span className="row-btn__title">{nextQuest.title}</span>
            <span className="row-btn__sub">{nextQuest.situation}</span>
          </span>
        </button>
      ) : (
        <Note tone="good" title="Все задания пройдены">
          Можно завершить неделю и посмотреть итоги.
        </Note>
      )}

      {/* Бонус за вход */}
      {canClaimBonus(state) && (
        <Button variant="good" block icon="coin" onClick={() => dispatch({ type: 'claimBonus' })}>
          Забрать бонус за вход: +{DAILY_BONUS}
        </Button>
      )}

      {/* Завершение недели */}
      <Button block onClick={() => go('summary')}>
        Завершить неделю {state.periodIndex}
      </Button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Button variant="quiet" icon="chart" onClick={() => go('progress')}>
          Прогресс
        </Button>
        <Button variant="quiet" icon="book" onClick={() => go('glossary')}>
          Словарик
        </Button>
      </div>

      <p className="muted" style={{ textAlign: 'center' }}>
        Свободных фиников: <Money value={state.balance} />
      </p>
    </>
  )
}
