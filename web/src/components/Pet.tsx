import { accessoryById, paletteById, speciesById, type Palette } from '../content/appearance'
import { type Mood } from '../domain/pet'
import type { PetLook } from '../domain/types'

export function Pet({
  look,
  mood = 'happy',
  size = 180,
  stageIndex = 0,
  animate = true,
}: {
  look: PetLook
  mood?: Mood
  size?: number
  stageIndex?: number
  animate?: boolean
}) {
  const species = speciesById(look.speciesId)
  const palette = paletteById(look.paletteId)
  const accessory = accessoryById(look.accessoryId)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={animate ? 'pet-float' : undefined}
      role="img"
      aria-label={`Питомец: ${species.title}, ${palette.title.toLowerCase()}, ${accessory.title.toLowerCase()}`}
    >
      <ellipse cx="100" cy="176" rx="46" ry="9" fill="rgba(60,40,100,0.16)" />

      <Tail species={species.tail} palette={palette} />
      <Ears species={species.ears} palette={palette} />

      {/* Тело */}
      <ellipse cx="100" cy="116" rx="54" ry="52" fill={palette.body} />
      <ellipse cx="100" cy="128" rx="34" ry="36" fill={palette.belly} />

      {/* Голова */}
      <circle cx="100" cy="74" r="42" fill={palette.body} />
      <ellipse cx="100" cy="86" rx="24" ry="19" fill={palette.belly} />

      <Face mood={mood} detail={palette.detail} />
      <Accessory kind={accessory.kind} color={accessory.color} />
      <StageMarks stageIndex={stageIndex} detail={palette.detail} />
    </svg>
  )
}

function Ears({ species, palette }: { species: string; palette: Palette }) {
  switch (species) {
    case 'pointy':
      return (
        <g>
          <path d="M66 46 L58 8 L92 32 Z" fill={palette.body} />
          <path d="M134 46 L142 8 L108 32 Z" fill={palette.body} />
          <path d="M70 42 L66 20 L86 34 Z" fill={palette.detail} opacity="0.55" />
          <path d="M130 42 L134 20 L114 34 Z" fill={palette.detail} opacity="0.55" />
        </g>
      )
    case 'round':
      return (
        <g>
          <circle cx="68" cy="38" r="18" fill={palette.body} />
          <circle cx="132" cy="38" r="18" fill={palette.body} />
          <circle cx="68" cy="38" r="9" fill={palette.detail} opacity="0.5" />
          <circle cx="132" cy="38" r="9" fill={palette.detail} opacity="0.5" />
        </g>
      )
    case 'long':
      return (
        <g>
          <ellipse cx="80" cy="18" rx="11" ry="28" fill={palette.body} />
          <ellipse cx="120" cy="18" rx="11" ry="28" fill={palette.body} />
          <ellipse cx="80" cy="20" rx="5" ry="18" fill={palette.detail} opacity="0.5" />
          <ellipse cx="120" cy="20" rx="5" ry="18" fill={palette.detail} opacity="0.5" />
        </g>
      )
    default:
      return (
        <g>
          <path d="M74 40 Q64 18 80 12 Q78 28 88 36 Z" fill={palette.detail} />
          <path d="M126 40 Q136 18 120 12 Q122 28 112 36 Z" fill={palette.detail} />
        </g>
      )
  }
}

function Tail({ species, palette }: { species: string; palette: Palette }) {
  switch (species) {
    case 'fluffy':
      return (
        <g>
          <path
            d="M150 132 Q184 120 174 88 Q196 118 170 148 Q158 152 150 144 Z"
            fill={palette.body}
          />
          <path d="M172 96 Q186 116 168 140 Q182 114 172 96 Z" fill={palette.belly} opacity="0.7" />
        </g>
      )
    case 'thin':
      return (
        <path
          d="M150 140 Q182 136 178 104"
          stroke={palette.body}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
      )
    case 'spike':
      return (
        <g>
          <path d="M150 140 Q178 140 182 116" stroke={palette.body} strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M182 118 L196 108 L184 132 Z" fill={palette.detail} />
        </g>
      )
    default:
      return null
  }
}

function Face({ mood, detail }: { mood: Mood; detail: string }) {
  const eyeY = 70
  return (
    <g>
      {mood === 'happy' && (
        <>
          <path d="M78 68 q8 -9 16 0" stroke={detail} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M106 68 q8 -9 16 0" stroke={detail} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'ok' && (
        <>
          <circle cx="86" cy={eyeY} r="6" fill={detail} />
          <circle cx="114" cy={eyeY} r="6" fill={detail} />
          <circle cx="88" cy={eyeY - 2} r="2" fill="#fff" />
          <circle cx="116" cy={eyeY - 2} r="2" fill="#fff" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <path d="M78 66 q8 6 16 2" stroke={detail} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M106 68 q8 -4 16 -2" stroke={detail} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="86" cy={eyeY + 6} r="5" fill={detail} />
          <circle cx="114" cy={eyeY + 6} r="5" fill={detail} />
        </>
      )}

      <ellipse cx="100" cy="82" rx="6" ry="4.5" fill={detail} />

      {mood === 'happy' && (
        <path d="M88 90 q12 14 24 0" stroke={detail} strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {mood === 'ok' && (
        <path d="M90 92 h20" stroke={detail} strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {mood === 'sad' && (
        <path d="M88 96 q12 -12 24 0" stroke={detail} strokeWidth="4" fill="none" strokeLinecap="round" />
      )}

      <circle cx="70" cy="86" r="7" fill="#ff8fa3" opacity={mood === 'sad' ? 0.15 : 0.35} />
      <circle cx="130" cy="86" r="7" fill="#ff8fa3" opacity={mood === 'sad' ? 0.15 : 0.35} />
    </g>
  )
}

function Accessory({ kind, color }: { kind: string; color: string }) {
  switch (kind) {
    case 'scarf':
      return (
        <g>
          <path d="M70 108 q30 14 60 0 l2 12 q-32 14 -64 0 Z" fill={color} />
          <path d="M124 118 l14 26 l-14 4 l-6 -26 Z" fill={color} />
        </g>
      )
    case 'cap':
      return (
        <g>
          <path d="M62 50 a38 38 0 0 1 76 0 Z" fill={color} />
          <path d="M132 50 q26 2 26 12 l-28 -4 Z" fill={color} />
          <circle cx="100" cy="16" r="6" fill={color} />
        </g>
      )
    case 'glasses':
      return (
        <g fill="none" stroke={color} strokeWidth="4" strokeLinecap="round">
          <circle cx="86" cy="70" r="14" />
          <circle cx="114" cy="70" r="14" />
          <path d="M96 64 q4 -5 8 0" />
          <line x1="72" y1="66" x2="60" y2="60" />
          <line x1="128" y1="66" x2="140" y2="60" />
        </g>
      )
    default:
      return null
  }
}

function StageMarks({ stageIndex, detail }: { stageIndex: number; detail: string }) {
  if (stageIndex <= 0) return null
  const stars = Array.from({ length: Math.min(stageIndex, 3) })
  return (
    <g>
      {stars.map((_, i) => (
        <path
          key={i}
          d={star(38 + i * 18, 152, 7)}
          fill={detail}
          opacity="0.9"
        />
      ))}
    </g>
  )
}

function star(cx: number, cy: number, r: number): string {
  const points: string[] = []
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r / 2.3
    const angle = (Math.PI / 5) * i - Math.PI / 2
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`)
  }
  return `M${points.join('L')}Z`
}
