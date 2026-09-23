import { useMemo, useState } from 'react'

import { ACCESSORIES, PALETTES, SPECIES } from '../content/appearance'
import { Pet } from '../components/Pet'
import { Icon } from '../components/Icon'
import { Button, Card, Note } from '../components/ui'
import { randomLook } from '../domain/state'
import type { PetLook } from '../domain/types'

const NAME_MAX = 14

export function CreatePetScreen({
  onCreate,
}: {
  onCreate: (data: { playerName: string; petName: string; look: PetLook }) => void
}) {
  const [look, setLook] = useState<PetLook>({
    speciesId: SPECIES[0].id,
    paletteId: PALETTES[0].id,
    accessoryId: ACCESSORIES[0].id,
  })
  const [petName, setPetName] = useState('Финни')
  const [playerName, setPlayerName] = useState('')

  const canCreate = petName.trim().length > 0 && playerName.trim().length > 0
  const combinations = useMemo(() => SPECIES.length * PALETTES.length * ACCESSORIES.length, [])

  return (
    <div className="screen">
      <header className="topbar">
        <div className="topbar__title">Знакомство</div>
      </header>

      <main className="content">
        <Card tone="cream" style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-20%',
              right: '-20%',
              bottom: 0,
              height: 110,
              background: '#FFE0B3',
              borderRadius: '50% 50% 0 0',
            }}
          />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Pet look={look} size={176} />
          </div>
          <p className="muted" style={{ textAlign: 'center', position: 'relative' }}>
            Выбери, каким будет твой Финни. Всего вариантов: {combinations}.
          </p>
        </Card>

        <ChoiceRow
          legend="Кто это будет"
          options={SPECIES.map((s) => ({ id: s.id, title: s.title }))}
          value={look.speciesId}
          onChange={(speciesId) => setLook({ ...look, speciesId })}
          preview={(id) => <Pet look={{ ...look, speciesId: id }} size={58} animate={false} />}
        />

        <ChoiceRow
          legend="Цвет"
          options={PALETTES.map((p) => ({ id: p.id, title: p.title }))}
          value={look.paletteId}
          onChange={(paletteId) => setLook({ ...look, paletteId })}
          preview={(id) => <Pet look={{ ...look, paletteId: id }} size={58} animate={false} />}
        />

        <ChoiceRow
          legend="Аксессуар"
          options={ACCESSORIES.map((a) => ({ id: a.id, title: a.title }))}
          value={look.accessoryId}
          onChange={(accessoryId) => setLook({ ...look, accessoryId })}
          preview={(id) => <Pet look={{ ...look, accessoryId: id }} size={58} animate={false} />}
        />

        <Button variant="quiet" block icon="refresh" onClick={() => setLook(randomLook())}>
          Удиви меня
        </Button>

        <Card>
          <div className="stack">
            <label className="stack stack--tight">
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800 }}>
                Как назовём питомца?
              </span>
              <input
                type="text"
                value={petName}
                maxLength={NAME_MAX}
                onChange={(e) => setPetName(e.target.value)}
                aria-describedby="pet-name-hint"
              />
              <span id="pet-name-hint" className="muted">
                Любое игровое имя, до {NAME_MAX} букв.
              </span>
            </label>

            <label className="stack stack--tight">
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800 }}>
                А как называть тебя в игре?
              </span>
              <input
                type="text"
                value={playerName}
                maxLength={NAME_MAX}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Например, Капитан"
                aria-describedby="player-name-hint"
              />
              <span id="player-name-hint" className="muted">
                Придумай игровое прозвище — настоящее имя писать не нужно.
              </span>
            </label>
          </div>
        </Card>

        <Note tone="info" title="Без регистрации">
          Игра работает прямо на этом устройстве. Телефон, почта и настоящее имя не нужны.
        </Note>

        <Button
          block
          disabled={!canCreate}
          onClick={() => onCreate({ playerName: playerName.trim(), petName: petName.trim(), look })}
        >
          Готово, начинаем!
        </Button>
        {!canCreate && (
          <p className="muted" style={{ textAlign: 'center' }}>
            Впиши имя питомца и своё игровое имя.
          </p>
        )}
      </main>
    </div>
  )
}

function ChoiceRow({
  legend,
  options,
  value,
  onChange,
  preview,
}: {
  legend: string
  options: { id: string; title: string }[]
  value: string
  onChange: (id: string) => void
  preview: (id: string) => React.ReactNode
}) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend style={{ fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 8 }}>
        {legend}
      </legend>
      <div className="tiles" role="radiogroup" aria-label={legend}>
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={value === o.id}
            className="tile"
            onClick={() => onChange(o.id)}
          >
            {value === o.id && (
              <span className="tile__check" aria-hidden="true">
                <Icon name="check" color="#fff" size={14} width={3} />
              </span>
            )}
            <span aria-hidden="true">{preview(o.id)}</span>
            <span>{o.title}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
