import { QUESTS, QUEST_TOPICS, TOPIC_EMOJI, TOPIC_TITLES } from '../content/quests'
import { Card, Note, Screen } from '../components/ui'
import { useGame } from '../store/gameStore'
import type { Quest } from '../domain/types'

export function QuestsScreen({
  onBack,
  onOpen,
}: {
  onBack: () => void
  onOpen: (questId: string) => void
}) {
  const { state } = useGame()

  return (
    <Screen title="Задания" onBack={onBack}>
      <Note tone="info" title="Как это работает">
        В каждом задании нужно что-то решить. Объяснение придёт в любом случае — и когда
        получилось, и когда нет.
      </Note>

      {QUEST_TOPICS.map((topic) => {
        const topicQuests = QUESTS.filter((q) => q.topic === topic)
        return (
          <section key={topic} className="stack">
            <h2>
              <span aria-hidden="true">{TOPIC_EMOJI[topic]}</span> {TOPIC_TITLES[topic]}
            </h2>
            {topicQuests.map((quest, i) => (
              <QuestRow
                key={quest.id}
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

      <Card flat>
        <p className="muted">
          Выполнено заданий: {Object.keys(state.quests).length} из {QUESTS.length}
        </p>
      </Card>
    </Screen>
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

function QuestRow({
  quest,
  done,
  good,
  locked,
  onOpen,
}: {
  quest: Quest
  done: boolean
  good?: boolean
  locked: boolean
  onOpen: () => void
}) {
  return (
    <button
      className={`item${done ? ' item--done' : ''}`}
      onClick={onOpen}
      disabled={locked}
      aria-label={`${quest.title}. ${done ? 'Выполнено' : locked ? 'Откроется позже' : 'Доступно'}`}
    >
      <span className="item__emoji" aria-hidden="true">
        {locked ? '🔒' : done ? (good ? '✅' : '📘') : '🎲'}
      </span>
      <span className="stack stack--tight" style={{ minWidth: 0 }}>
        <span className="item__title">{quest.title}</span>
        <span className="muted">{locked ? 'Откроется после предыдущего задания' : quest.situation}</span>
        {done && (
          <span className="muted">
            {good ? 'Решено верно' : 'Пройдено, есть чему поучиться'} · можно перечитать разбор
          </span>
        )}
      </span>
      <span aria-hidden="true">{locked ? '' : '›'}</span>
    </button>
  )
}
