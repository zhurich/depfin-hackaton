import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from '../App'
import { GameProvider } from '../store/gameStore'
import { STARTING_BALANCE } from '../domain/rules'
import { loadState } from '../platform/storage'

function renderApp() {
  return render(
    <GameProvider>
      <App />
    </GameProvider>,
  )
}

async function passIntroAndCreatePet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Дальше' }))
  await user.click(screen.getByRole('button', { name: 'Дальше' }))
  await user.click(screen.getByRole('button', { name: 'Дальше' }))
  await user.click(screen.getByRole('button', { name: 'Начать игру' }))

  // Шаги 2–3
  expect(screen.getByText(/Без регистрации/)).toBeInTheDocument()
  await user.click(screen.getByRole('radio', { name: /Зайчик/ }))
  await user.click(screen.getByRole('radio', { name: /Мятный/ }))

  await user.clear(screen.getByLabelText(/Как назовём питомца/))
  await user.type(screen.getByLabelText(/Как назовём питомца/), 'Финни')
  await user.type(screen.getByLabelText(/как называть тебя в игре/i), 'Капитан')

  await user.click(screen.getByRole('button', { name: /Готово, начинаем/ }))
}

async function enterParentZone(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Раздел для взрослого/ }))
  const task = screen.getByText(/×/).textContent!
  const [a, b] = task.match(/\d+/g)!.map(Number)
  await user.type(screen.getByLabelText('Ответ на пример'), String(a * b))
  await user.click(screen.getByRole('button', { name: 'Войти' }))
}

describe('обязательный сценарий (Приложение А)', () => {
  it('проходится от первого запуска до покупок первой недели', async () => {
    const user = userEvent.setup()
    renderApp()

    await passIntroAndCreatePet(user)

    expect(screen.getByText(/Неделя 1 · Капитан/)).toBeInTheDocument()
    expect(screen.getAllByText(new RegExp(`${STARTING_BALANCE} Ф`)).length).toBeGreaterThan(0)
    expect(screen.getByText('Задание недели')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Выбрать цель для копилки/ })).toBeInTheDocument()

    expect(screen.getByRole('img', { name: /Питомец: Зайчик/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Сытость/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Уход/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Радость/ })).toBeInTheDocument()

    // Шаг 5
    await user.click(screen.getByRole('button', { name: /^План/ }))
    expect(screen.getByText('Не разложено')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Подтвердить план' }))
    await user.click(screen.getByRole('button', { name: /Да, это мой план/ }))
    expect(screen.getByText(/План на эту неделю подтверждён/)).toBeInTheDocument()

    // Шаг 7
    await user.click(screen.getByRole('button', { name: /Перейти к покупкам/ }))
    await user.click(screen.getByRole('button', { name: /Каша/ }))
    await user.click(screen.getByRole('button', { name: /Купить за 20 Ф/ }))
    expect(screen.getByText(/Покупка сделана/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Наклейки/ }))
    await user.click(screen.getByRole('button', { name: /Купить за 20 Ф/ }))

    expect(screen.getByText('Что уже куплено на этой неделе')).toBeInTheDocument()
  })

  it('не даёт купить при нехватке средств и объясняет варианты', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /^Покупки/ }))

    await user.click(screen.getByRole('button', { name: /Праздничный торт/ }))
    await user.click(screen.getByRole('button', { name: /Купить за 60 Ф/ }))
    await user.click(screen.getByRole('button', { name: /Кораблик/ }))
    await user.click(screen.getByRole('button', { name: /Купить за 55 Ф/ }))

    await user.click(screen.getByRole('button', { name: /Шапочка/ }))

    expect(screen.getByText(/Не хватает 40/)).toBeInTheDocument()
    expect(screen.getByText('Что можно сделать')).toBeInTheDocument()
    expect(screen.getByText(/Отказаться от желанного — это не ошибка/)).toBeInTheDocument()
  })

  it('выполняет задание, объясняет результат и начисляет валюту', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /^Задания/ }))
    await user.click(screen.getByRole('button', { name: /Копилка на самокат/ }))

    await user.type(screen.getByLabelText(/Твой ответ/), '60')
    await user.click(screen.getByRole('button', { name: 'Ответить' }))

    expect(screen.getByText('Получилось!')).toBeInTheDocument()
    expect(screen.getByText('Начислено')).toBeInTheDocument()
    expect(screen.getByText(/240 ÷ 4 = 60/)).toBeInTheDocument()
  })

  it('объясняет результат и при неверном ответе, и награда всё равно есть', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /^Задания/ }))
    await user.click(screen.getByRole('button', { name: /Копилка на самокат/ }))
    await user.type(screen.getByLabelText(/Твой ответ/), '10')
    await user.click(screen.getByRole('button', { name: 'Ответить' }))

    expect(screen.getByText('Разберём вместе')).toBeInTheDocument()
    expect(screen.getByText(/верный — 60/)).toBeInTheDocument()
    expect(screen.getByText('Начислено')).toBeInTheDocument()
  })

  it('в демонстрационном режиме все задания открыты сразу', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await enterParentZone(user)
    const demoSwitch = screen.getByRole('switch', { name: /Демонстрационный режим/ })
    expect(demoSwitch).toHaveAttribute('aria-checked', 'false')
    await user.click(demoSwitch)
    expect(
      screen.getByRole('switch', { name: /Демонстрационный режим/ }),
    ).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Назад' }))

    await user.click(screen.getByRole('button', { name: /^Задания/ }))
    expect(screen.getByRole('button', { name: /Сколько сдачи/ })).toBeEnabled()
  })

  it('позволяет выбрать цель, пополнить копилку и показывает прогресс', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /Выбрать цель для копилки/ }))
    await user.click(screen.getByRole('button', { name: /Самокат для Финни/ }))

    expect(screen.getByText(/Осталось накопить/)).toBeInTheDocument()
    expect(screen.getByText(/Пополни копилку хотя бы один раз/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Отложить 20 Ф/ }))

    expect(screen.getByText(/Ты откладываешь примерно 20/)).toBeInTheDocument()
  })

  it('требует отдельного подтверждения на снятие и показывает последствие', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /Выбрать цель для копилки/ }))
    await user.click(screen.getByRole('button', { name: /Самокат для Финни/ }))
    await user.click(screen.getByRole('button', { name: /Отложить 20 Ф/ }))

    await user.click(screen.getByRole('button', { name: 'Снять из копилки' }))
    expect(screen.getByText(/Копилка уменьшится с 20 до 10/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Снять 10 Ф$/ }))
    expect(screen.getByText('Точно снять?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Да, снять 10 Ф/ }))
  })

  it('закрывает период, объясняет итоги и начинает следующую неделю', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /^План/ }))
    await user.click(screen.getByRole('button', { name: 'Подтвердить план' }))
    await user.click(screen.getByRole('button', { name: /Да, это мой план/ }))
    await user.click(screen.getByRole('button', { name: 'Назад' }))

    await user.click(screen.getByRole('button', { name: /Завершить неделю 1/ }))
    expect(screen.getByText('План и факт')).toBeInTheDocument()
    expect(screen.getByText('Что будет с Финни')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Завершить неделю 1$/ }))
    await user.click(screen.getByRole('button', { name: /Да, завершить/ }))

    expect(screen.getByText('Неделя 1 закрыта')).toBeInTheDocument()
    expect(screen.getByText('Почему так вышло')).toBeInTheDocument()
    expect(screen.getByText('Следующий шаг')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Составить план на неделю 2/ })).toBeInTheDocument()
  })

  it('сохраняет прогресс после закрытия и повторного запуска (шаг 11)', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /^Покупки/ }))
    await user.click(screen.getByRole('button', { name: /Каша/ }))
    await user.click(screen.getByRole('button', { name: /Купить за 20 Ф/ }))

    const saved = loadState()
    expect(saved?.balance).toBe(STARTING_BALANCE - 20)
    expect(saved?.pet?.name).toBe('Финни')

    unmount()
    renderApp()

    expect(screen.getByText(/Неделя 1 · Капитан/)).toBeInTheDocument()
    expect(screen.getAllByText(/100 Ф/).length).toBeGreaterThan(0)
  })

  it('открывает раздел для взрослого только после арифметического барьера (шаг 12)', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /Раздел для взрослого/ }))
    expect(screen.getByText(/Этот раздел — для родителя/)).toBeInTheDocument()
    expect(screen.queryByText('Чему учит игра')).not.toBeInTheDocument()

    const task = screen.getByText(/×/).textContent!
    const [a, b] = task.match(/\d+/g)!.map(Number)
    await user.type(screen.getByLabelText('Ответ на пример'), String(a * b))
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(screen.getByText('Чему учит игра')).toBeInTheDocument()
    expect(screen.getByText('Что уже освоено')).toBeInTheDocument()
    expect(screen.getByText(/Это описание опыта, а не оценка/)).toBeInTheDocument()
  })

  it('сбрасывает тестовый профиль из раздела для взрослого', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /^Покупки/ }))
    await user.click(screen.getByRole('button', { name: /Каша/ }))
    await user.click(screen.getByRole('button', { name: /Купить за 20 Ф/ }))
    await user.click(screen.getByRole('button', { name: 'Назад' }))

    await enterParentZone(user)

    await user.click(screen.getByRole('button', { name: /Сбросить профиль к началу/ }))
    expect(screen.getByText('Сбросить профиль?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Да, сбросить/ }))

    expect(screen.getByText('Знакомься — это Финни')).toBeInTheDocument()
  })
})

describe('доступность интерфейса', () => {
  it('кнопка возврата имеет доступное имя, показатели читаются текстом', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /^План/ }))
    const back = screen.getByRole('button', { name: 'Назад' })
    expect(back).toBeInTheDocument()

    await user.click(back)
    expect(screen.getByRole('img', { name: /Сытость: \d+ из 100/ })).toBeInTheDocument()
  })

  it('словарик открывается и объясняет термины', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /Словарик/ }))
    await user.click(screen.getByRole('button', { name: /Бюджет/ }))

    expect(screen.getByText(/Все деньги, которые у тебя есть/)).toBeInTheDocument()
    expect(screen.getByText(/Например/)).toBeInTheDocument()
  })

  it('знакомство можно пересмотреть в любой момент', async () => {
    const user = userEvent.setup()
    renderApp()
    await passIntroAndCreatePet(user)

    await user.click(screen.getByRole('button', { name: /Словарик/ }))
    await user.click(screen.getByRole('button', { name: /Посмотреть знакомство ещё раз/ }))

    expect(screen.getByText('Знакомься — это Финни')).toBeInTheDocument()
  })
})
