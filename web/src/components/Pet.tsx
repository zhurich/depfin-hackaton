import { accessoryById, paletteById, speciesById, type Palette } from '../content/appearance'
import { type Mood } from '../domain/pet'
import type { PetLook } from '../domain/types'

const INK = '#2C2419'
const STROKE = 3.5

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

  const eyeY = mood === 'sad' ? 74 : 70
  const eyeHiY = mood === 'sad' ? 71.5 : 67.5
  const cheek = mood === 'sad' ? 0.2 : 0.45
  const mouth =
    mood === 'happy'
      ? 'M88 92 q12 13 24 0'
      : mood === 'ok'
        ? 'M90 94 h20'
        : 'M88 98 q12 -12 24 0'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={animate ? 'pet-float' : undefined}
      role="img"
      aria-label={`Питомец: ${species.title}, ${palette.title.toLowerCase()}, ${accessory.title.toLowerCase()}`}
    >
      <ellipse cx="100" cy="178" rx="48" ry="8" fill="rgba(62,42,92,.16)" />

      <Tail kind={species.tail} palette={palette} />
      <Ears kind={species.ears} palette={palette} />

      <path d="M100 32 L100 18" stroke={palette.detail} strokeWidth="4" strokeLinecap="round" />
      <ellipse
        cx="111"
        cy="14"
        rx="12"
        ry="6"
        fill="#4FB187"
        stroke={INK}
        strokeWidth="3"
        transform="rotate(-16 111 14)"
      />

      {/* Тело */}
      <ellipse cx="100" cy="124" rx="52" ry="47" fill={palette.body} stroke={INK} strokeWidth={STROKE} />
      <ellipse cx="100" cy="134" rx="31" ry="32" fill={palette.belly} />

      {/* Голова */}
      <circle cx="100" cy="72" r="41" fill={palette.body} stroke={INK} strokeWidth={STROKE} />
      <ellipse cx="100" cy="84" rx="23" ry="17" fill={palette.belly} />

      <circle cx="70" cy="92" r="8" fill="#F1836B" opacity={cheek} />
      <circle cx="130" cy="92" r="8" fill="#F1836B" opacity={cheek} />

      <circle cx="86" cy={eyeY} r="7" fill={INK} />
      <circle cx="114" cy={eyeY} r="7" fill={INK} />
      <circle cx="88.5" cy={eyeHiY} r="2.6" fill="#fff" />
      <circle cx="116.5" cy={eyeHiY} r="2.6" fill="#fff" />

      <ellipse cx="100" cy="80" rx="6" ry="4.5" fill={palette.detail} />
      <path d={mouth} stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />

      <Accessory kind={accessory.kind} color={accessory.color} />
      <StageMarks stageIndex={stageIndex} />
    </svg>
  )
}

function Ears({ kind, palette }: { kind: string; palette: Palette }) {
  switch (kind) {
    case 'pointy':
      return (
        <g>
          <path d="M64 48 L54 10 L92 32 Z" fill={palette.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <path d="M136 48 L146 10 L108 32 Z" fill={palette.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <path d="M68 42 L63 22 L84 34 Z" fill={palette.detail} />
          <path d="M132 42 L137 22 L116 34 Z" fill={palette.detail} />
        </g>
      )
    case 'round':
      return (
        <g>
          <circle cx="66" cy="44" r="19" fill={palette.body} stroke={INK} strokeWidth={STROKE} />
          <circle cx="134" cy="44" r="19" fill={palette.body} stroke={INK} strokeWidth={STROKE} />
          <circle cx="66" cy="44" r="8" fill={palette.detail} />
          <circle cx="134" cy="44" r="8" fill={palette.detail} />
        </g>
      )
    case 'long':
      return (
        <g>
          <ellipse cx="78" cy="22" rx="12" ry="30" fill={palette.body} stroke={INK} strokeWidth={STROKE} />
          <ellipse cx="122" cy="22" rx="12" ry="30" fill={palette.body} stroke={INK} strokeWidth={STROKE} />
          <ellipse cx="78" cy="24" rx="5" ry="19" fill={palette.detail} />
          <ellipse cx="122" cy="24" rx="5" ry="19" fill={palette.detail} />
        </g>
      )
    default:
      return (
        <g>
          <path
            d="M72 44 Q58 20 78 12 Q74 30 88 38 Z"
            fill={palette.detail}
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M128 44 Q142 20 122 12 Q126 30 112 38 Z"
            fill={palette.detail}
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
      )
  }
}

function Tail({ kind, palette }: { kind: string; palette: Palette }) {
  switch (kind) {
    case 'fluffy':
      return (
        <path
          d="M148 138 Q186 126 176 88 Q200 122 172 154 Q158 158 148 150 Z"
          fill={palette.body}
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
      )
    case 'thin':
      return (
        <path
          d="M148 146 Q184 142 180 104"
          stroke={INK}
          strokeWidth={STROKE + 7}
          strokeLinecap="round"
          fill="none"
        />
      )
    case 'spike':
      return (
        <g>
          <path
            d="M148 146 Q180 146 184 116"
            stroke={INK}
            strokeWidth={STROKE + 8}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M184 118 L200 106 L188 136 Z"
            fill={palette.detail}
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
      )
    default:
      return null
  }
}

function Accessory({ kind, color }: { kind: string; color: string }) {
  switch (kind) {
    case 'scarf':
      return (
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M70 106 q30 16 60 0 l3 14 q-33 16 -66 0 Z" fill={color} />
          <path d="M124 120 l15 28 l-16 4 l-7 -28 Z" fill={color} />
        </g>
      )
    case 'cap':
      return (
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M62 52 a38 38 0 0 1 76 0 Z" fill={color} />
          <path d="M134 52 q26 2 26 12 l-30 -5 Z" fill={color} />
        </g>
      )
    case 'glasses':
      return (
        <g fill="none" stroke={color} strokeWidth="4" strokeLinecap="round">
          <circle cx="86" cy="70" r="15" />
          <circle cx="114" cy="70" r="15" />
          <path d="M96 64 q4 -5 8 0" />
          <path d="M71 66 L58 60" />
          <path d="M129 66 L142 60" />
        </g>
      )
    default:
      return null
  }
}

function StageMarks({ stageIndex }: { stageIndex: number }) {
  if (stageIndex <= 0) return null
  return (
    <g>
      {Array.from({ length: Math.min(stageIndex, 3) }).map((_, i) => (
        <rect
          key={i}
          x={34 + i * 20}
          y={152}
          width="11"
          height="11"
          rx="2"
          fill="#F7C948"
          stroke={INK}
          strokeWidth="2.5"
          transform={`rotate(45 ${39.5 + i * 20} 157.5)`}
        />
      ))}
    </g>
  )
}
