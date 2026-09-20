import { useCallback, useEffect, useState } from 'react'

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
import { registerBackHandler } from './platform/bridge'
import { setSoundEnabled } from './platform/sound'
import { useGame } from './store/gameStore'
import type { Location, Route } from './navigation'

export function App() {
  const { state, dispatch } = useGame()
  const [stack, setStack] = useState<Location[]>([{ route: 'home' }])
  const current = stack[stack.length - 1]

  const go = useCallback((route: Route, questId?: string) => {
    setStack((prev) => [...prev, { route, questId }])
  }, [])

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  useEffect(
    () =>
      registerBackHandler(() => {
        if (stack.length > 1) {
          back()
          return true
        }
        return false
      }),
    [stack.length, back],
  )

  useEffect(() => {
    document.documentElement.classList.toggle('no-motion', !state.settings.motion)
    setSoundEnabled(state.settings.sound)
  }, [state.settings.motion, state.settings.sound])

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
          setStack([{ route: 'home' }])
        }}
      />
    )
  }

  switch (current.route) {
    case 'budget':
      return <BudgetScreen go={go} onBack={back} />
    case 'shop':
      return <ShopScreen go={go} onBack={back} />
    case 'savings':
      return <SavingsScreen onBack={back} />
    case 'quests':
      return <QuestsScreen onBack={back} onOpen={(questId) => go('quest', questId)} />
    case 'quest':
      return <QuestPlayScreen questId={current.questId!} onBack={back} />
    case 'summary':
      return <SummaryScreen go={goReset(setStack)} onBack={back} />
    case 'progress':
      return <ProgressScreen go={go} onBack={back} />
    case 'glossary':
      return <GlossaryScreen onBack={back} />
    case 'parent':
      return <ParentScreen onBack={back} />
    case 'intro':
      return <OnboardingScreen reviewMode onDone={back} />
    case 'home':
    default:
      return <HomeScreen go={go} />
  }
}

function goReset(setStack: React.Dispatch<React.SetStateAction<Location[]>>) {
  return (route: Route) => {
    setStack(route === 'home' ? [{ route: 'home' }] : [{ route: 'home' }, { route }])
  }
}
