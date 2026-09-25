// jsdom не считает раскладку, поэтому display:block у полос проверяем по CSS.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProgressBar, StatBar } from './ui'

const CSS = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8')

function ruleBody(selector: string): string {
  const match = new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`).exec(CSS)
  if (!match) throw new Error(`В global.css нет правила ${selector}`)
  return match[1]
}

describe('раскладка полос заполнения', () => {
  it.each(['.bar', '.bar__fill'])('%s остаётся блочным элементом', (selector) => {
    expect(ruleBody(selector)).toMatch(/display:\s*block/)
  })

  it('у дорожки задана высота, а у заливки — высота на всю дорожку', () => {
    expect(ruleBody('.bar')).toMatch(/height:\s*\d+px/)
    expect(ruleBody('.bar__fill')).toMatch(/height:\s*100%/)
  })
})

describe('показатель состояния питомца', () => {
  function renderStat(value: number) {
    const { container } = render(
      <StatBar
        icon="bowl"
        label="Сытость"
        value={value}
        color="var(--need)"
        wash="var(--need-wash)"
      />,
    )
    return container.querySelector<HTMLElement>('.bar__fill')!
  }

  it('ширина заливки равна значению показателя', () => {
    expect(renderStat(72).style.width).toBe('72%')
  })

  it('пустой и полный показатели не схлопываются в одно и то же', () => {
    expect(renderStat(0).style.width).toBe('0%')
    expect(renderStat(100).style.width).toBe('100%')
  })

  it('значение доступно текстом и числом, а не только полосой', () => {
    renderStat(72)
    expect(screen.getByRole('img', { name: 'Сытость: 72 из 100' })).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('низкий показатель помечен словом, а не только цветом', () => {
    renderStat(20)
    expect(screen.getByText(/· мало/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Сытость: 20 из 100, мало/ })).toBeInTheDocument()
  })
})

describe('полоса прогресса цели', () => {
  function renderProgress(value: number) {
    const { container } = render(<ProgressBar value={value} label="Самокат" />)
    return container.querySelector<HTMLElement>('.bar__fill')!
  }

  it('переводит долю в проценты ширины', () => {
    expect(renderProgress(0.25).style.width).toBe('25%')
  })

  it('не выходит за границы дорожки', () => {
    expect(renderProgress(1.8).style.width).toBe('100%')
    expect(renderProgress(-0.5).style.width).toBe('0%')
  })

  it('озвучивает прогресс в процентах', () => {
    renderProgress(0.4)
    expect(screen.getByRole('img', { name: 'Самокат: 40%' })).toBeInTheDocument()
  })
})
