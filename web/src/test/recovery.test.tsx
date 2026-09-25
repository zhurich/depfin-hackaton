import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from '../App'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { GameProvider } from '../store/gameStore'
import { loadState } from '../platform/storage'

const KEY = 'finni.profile.v1'

// профиль сборки до редизайна (schema v1)
const LEGACY_PROFILE = {
  schemaVersion: 1,
  onboardingDone: true,
  playerName: 'Капитан',
  pet: { speciesId: 'bunny', paletteId: 'mint', accessoryId: 'none', name: 'Финни' },
  balance: 80,
  stats: { fullness: 70, care: 70, joy: 60 },
  growth: 4,
  goals: [
    {
      id: 'scooter',
      title: 'Самокат для Финни',
      emoji: '🛴',
      cost: 240,
      caption: 'Будете кататься в парке.',
      custom: false,
      saved: 40,
      achievedAtPeriod: null,
    },
  ],
  activeGoalId: 'scooter',
  periodIndex: 2,
  plan: null,
  planConfirmed: false,
  period: {
    income: 100,
    essentialSpent: 20,
    optionalSpent: 0,
    savedThisPeriod: 0,
    purchases: [
      { itemId: 'porridge', title: 'Каша', emoji: '🥣', price: 20, kind: 'essential', at: 0 },
    ],
    questsDone: [],
    bonusesTaken: 0,
    parentBonusThisPeriod: 0,
  },
  lastBonusDate: null,
  ledger: [],
  quests: {},
  history: [],
  savingStreak: 0,
  settings: { sound: true, motion: true, demoMode: false },
  parentBonusTotal: 0,
  createdAt: 0,
  updatedAt: 0,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('профиль из прошлой версии приложения', () => {
  it('открывается, а не оставляет пустой экран', () => {
    localStorage.setItem(KEY, JSON.stringify(LEGACY_PROFILE))

    render(
      <ErrorBoundary>
        <GameProvider>
          <App />
        </GameProvider>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Капитан')).toBeInTheDocument()
    expect(screen.getByText('Неделя 2')).toBeInTheDocument()
    expect(screen.queryByText(/Финни прилёг отдохнуть/)).not.toBeInTheDocument()
  })

  it('сохраняет прогресс и подставляет недостающие иконки', () => {
    localStorage.setItem(KEY, JSON.stringify(LEGACY_PROFILE))

    render(
      <ErrorBoundary>
        <GameProvider>
          <App />
        </GameProvider>
      </ErrorBoundary>,
    )

    const migrated = loadState()!
    expect(migrated.balance).toBe(80)
    expect(migrated.goals[0].saved).toBe(40)
    expect(migrated.goals[0].icon).toBe('scooter')
    expect(migrated.period.purchases[0].icon).toBe('bowl')
    expect(migrated.schemaVersion).toBe(2)
  })
})

describe('граница ошибок', () => {
  function Broken(): JSX.Element {
    throw new Error('тестовое падение отрисовки')
  }

  it('показывает экран восстановления вместо пустой страницы', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Финни прилёг отдохнуть')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Перезапустить игру' })).toBeInTheDocument()
  })

  it('стирание прогресса требует подтверждения', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )

    expect(screen.queryByRole('button', { name: /Да, начать заново/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Начать заново' }))
    expect(screen.getByText(/Это нельзя отменить/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Да, начать заново/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(screen.queryByRole('button', { name: /Да, начать заново/ })).not.toBeInTheDocument()
  })

  it('подробности ошибки спрятаны от ребёнка под отдельным раскрытием', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )

    const details = screen.getByText('Подробности для взрослого')
    expect(details).toBeInTheDocument()
    expect(details.closest('details')).not.toHaveAttribute('open')
  })
})
