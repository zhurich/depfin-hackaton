import { QUESTS, QUEST_TOPICS, TOPIC_ICON, TOPIC_TITLES } from '../content/quests'
import { Glyph, Note, ScreenHead } from '../components/ui'
import { Icon } from '../components/Icon'
import { useGame } from '../store/gameStore'
import type { Quest } from '../domain/types'

export function QuestsScreen({ onOpen }: { onOpen: (questId: string) => void }) {
  const { state } = useGame()
  const doneCount = Object.keys(state.quests).length

  return (
    <>
      <ScreenHead
        title="Задания"
        sub="Каждое задание — настоящая ситуация. Награда приходит, даже если решил не с первого раза."
      />

      {QUEST_TOPICS.map((topic) => {
        const topicQuests = QUESTS.filter((q) => q.topic === topic)
        return (
          <section key={topic} className="stack">
            <div className="row" style={{ gap: 9 }}>
              <Glyph name={TOPIC_ICON[topic]} wash="var(--brand-wash)" color="var(--brand)" size="sm" />
              <h2 style={{ fontSize: 19 }}>{TOPIC_TITLES[topic]}</h2>
            </div>

            {topicQuests.map((quest, i) => (
              <QuestCard
                key={quest.id}
                index={i + 1}
                quest={quest}
                done={Boolean(state.quests[quest.id])}
                good={state.quests[quest.id]?.good}
                locked={isLocked(topicQuests, i, state)}
                onOpen={() => onOpen(quest.id)}
              />
            ))}
          </section>
        )
      })}

      <Note tone="info">
        Выполнено заданий: {doneCount} из {QUESTS.length}.
      </Note>
    </>
  )
}

function isLocked(
  topicQuests: Quest[],
  index: number,
  state: ReturnType<typeof useGame>['state'],
): boolean {
  if (state.settings.demoMode) return false
  if (index === 0) return false
  return !state.quests[topicQuests[index - 1].id]
}

function QuestCard({
  index,
  quest,
  done,
  good,
  locked,
  onOpen,
}: {
  index: number
  quest: Quest
  done: boolean
  good?: boolean
  locked: boolean
  onOpen: () => void
}) {
  const status = done
    ? good
      ? 'Решено верно'
      : 'Пройдено, есть чему поучиться'
    : locked
      ? 'Откроется дальше'
      : 'Можно решать'

  const theme = done
    ? { bg: 'var(--neutral)', border: 'var(--neutral-border)', badge: 'var(--neutral-border)' }
    : locked
      ? { bg: 'var(--card)', border: 'var(--card-border)', badge: 'var(--neutral)' }
      : { bg: 'var(--card)', border: 'var(--cream-border)', badge: 'var(--sun)' }

  return (
    <button
      className="row-btn"
      onClick={onOpen}
      disabled={locked}
      style={{ background: theme.bg, borderColor: theme.border, alignItems: 'flex-start' }}
      aria-label={`${quest.title}. ${status}`}
    >
      <span className="glyph glyph--ink" style={{ background: theme.badge }} aria-hidden="true">
        {locked ? (
          <Icon name="lock" color="var(--ink)" size={20} />
        ) : done ? (
          <Icon name={good ? 'check' : 'bulb'} color="var(--ink)" size={20} />
        ) : (
          <span className="num" style={{ fontSize: 18 }}>
            {index}
          </span>
        )}
      </span>

      <span className="row-btn__body">
        <span className="row-btn__title">{quest.title}</span>
        <span className="row-btn__sub">{quest.situation}</span>
        <span
          className="tag"
          style={{ background: '#fff', border: `2px solid ${theme.border}`, marginTop: 6, alignSelf: 'flex-start' }}
        >
          {status}
        </span>
      </span>
    </button>
  )
}
