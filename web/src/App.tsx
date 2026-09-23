import { useCallback, useEffect, useMemo, useState } from 'react'

import { BudgetScreen } from './screens/BudgetScreen'
import { CreatePetScreen } from './screens/CreatePetScreen'
import { GlossaryScreen } from './screens/GlossaryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { ParentScreen } from './screens/ParentScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { QuestPlayScreen } from './screens/QuestPlayScreen'
import { QuestsScreen } from './screens/QuestsScreen'
import { SavingsScreen } from './screens/SavingsScreen'
import { ShopScreen } from './screens/ShopScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { AppShell, type TabDef } from './components/ui'
import { registerBackHandler } from './platform/bridge'
import { setSoundEnabled } from './platform/sound'
import { useGame } from './store/gameStore'
import { TAB_ROUTES, isTabRoute, type Location, type Route } from './navigation'

export function App() {
  const { state, dispatch, pendingQuestIds } = useGame()
  const [stack, setStack] = useState<Location[]>([{ route: 'home' }])
  const current = stack[stack.length - 1]

  const go = useCallback((route: Route, questId?: string) => {
    setStack((prev) => {
      if (isTabRoute(route)) return [{ route, questId }]
      return [...prev, { route, questId }]
    })
  }, [])

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const resetTo = useCallback((route: Route) => {
    setStack([{ route }])
  }, [])

  // С любой вкладки кроме главной «Назад» ведёт на главную.
  useEffect(
    () =>
      registerBackHandler(() => {
        if (stack.length > 1) {
          back()
          return true
        }
        if (current.route !== 'home') {
          resetTo('home')
          return true
        }
        return false
      }),
    [stack.length, current.route, back, resetTo],
  )

  useEffect(() => {
    document.documentElement.classList.toggle('no-motion', !state.settings.motion)
    setSoundEnabled(state.settings.sound)
  }, [state.settings.motion, state.settings.sound])

  const tabs = useMemo<TabDef[]>(
    () =>
      TAB_ROUTES.map((t) => ({
        key: t.key,
        label: t.label,
        icon: t.icon,
        badge: t.key === 'quests' ? pendingQuestIds.length : undefined,
      })),
    [pendingQuestIds.length],
  )

  if (!state.onboardingDone) {
    return (
      <OnboardingScreen
        onDone={() => dispatch({ type: 'finishOnboarding' })}
        onSkip={() => dispatch({ type: 'finishOnboarding' })}
      />
    )
  }

  if (!state.pet) {
    return (
      <CreatePetScreen
        onCreate={({ playerName, petName, look }) => {
          dispatch({ type: 'createPet', playerName, petName, look })
          resetTo('home')
        }}
      />
    )
  }

  const onTab = (key: string) => go(key as Route)

  const tabbed = (node: React.ReactNode) => (
    <AppShell
      week={state.periodIndex}
      playerName={state.playerName}
      balance={state.balance}
      onParent={() => go('parent')}
      tabs={tabs}
      activeTab={current.route}
      onTab={onTab}
    >
      {node}
    </AppShell>
  )

  const stacked = (title: string, node: React.ReactNode, showBalance = true) => (
    <AppShell title={title} onBack={back} balance={showBalance ? state.balance : undefined}>
      {node}
    </AppShell>
  )

  switch (current.route) {
    case 'budget':
      return tabbed(<BudgetScreen go={go} />)
    case 'shop':
      return tabbed(<ShopScreen go={go} />)
    case 'savings':
      return tabbed(<SavingsScreen />)
    case 'quests':
      return tabbed(<QuestsScreen onOpen={(questId) => go('quest', questId)} />)

    case 'quest':
      return stacked('Задание', <QuestPlayScreen questId={current.questId!} onBack={back} />)
    case 'summary':
      return stacked(
        `Неделя ${state.periodIndex}`,
        <SummaryScreen go={resetTo} onBack={back} />,
      )
    case 'progress':
      return stacked('Путь Финни', <ProgressScreen go={go} />)
    case 'glossary':
      return stacked('Словарик', <GlossaryScreen />)
    case 'parent':
      return stacked('Для взрослого', <ParentScreen />, false)
    case 'intro':
      return <OnboardingScreen reviewMode onDone={back} />

    case 'home':
    default:
      return tabbed(<HomeScreen go={go} />)
  }
}
