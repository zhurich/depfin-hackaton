// Сетка 24×24, обводка 2.2.

import type { IconName } from '../domain/types'

interface Shape {
  p?: string[]
  c?: [number, number, number][]
}

const SHAPES: Record<IconName, Shape> = {
  // навигация и служебные
  home: { p: ['M4 11l8-6 8 6v8H4z', 'M10 19v-5h4v5'] },
  envelope: { p: ['M4 7h16v11H4z', 'M4 8l8 6 8-6'] },
  cart: { p: ['M4 6h3l2 9h9', 'M7 9h13l-2 6'], c: [[10, 19, 1.4], [17, 19, 1.4]] },
  jar: { p: ['M6 9h12v10H6z', 'M9 9V6h6v3', 'M12 12v4'] },
  star: { p: ['M12 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2z'] },
  chart: { p: ['M4 19h16', 'M7 19v-6', 'M12 19V7', 'M17 19v-9'] },
  book: { p: ['M5 5h14v14H5z', 'M9 5v14'] },
  user: { p: ['M5 20c1.4-3.6 4-5 7-5s5.6 1.4 7 5'], c: [[12, 8.5, 3.6]] },
  back: { p: ['M15 5l-7 7 7 7'] },
  chevron: { p: ['M9 5l7 7-7 7'] },
  check: { p: ['M5 12.5l4.5 4.5L19 7'] },
  bulb: { p: ['M10 17h4', 'M11 20h2'], c: [[12, 10, 5]] },
  plus: { p: ['M12 5v14', 'M5 12h14'] },
  minus: { p: ['M5 12h14'] },
  coin: { p: ['M12 8v8', 'M9.5 10.5h5', 'M9.5 13.5h5'], c: [[12, 12, 8]] },
  lock: { p: ['M6 11h12v9H6z', 'M9 11V8a3 3 0 0 1 6 0v3'] },
  refresh: { p: ['M19 12a7 7 0 1 1-2.5-5.4', 'M19 4v4h-4'] },
  trash: { p: ['M5 7h14', 'M9 7V5h6v2', 'M7 7l1 13h8l1-13', 'M11 11v6', 'M13 11v6'] },
  sound: { p: ['M5 10h3l4-4v12l-4-4H5z', 'M16 9.5a3.5 3.5 0 0 1 0 5'] },
  motion: { p: ['M5 12h4', 'M11 8h8', 'M11 12h8', 'M11 16h5'], c: [[7, 8, 1.4], [7, 16, 1.4]] },
  close: { p: ['M6 6l12 12', 'M18 6L6 18'] },

  // питомец и покупки
  bowl: { p: ['M4 12h16a8 8 0 0 1 -16 0z', 'M10 8c0-2 1-3 2.5-3'] },
  salad: { p: ['M12 6v4', 'M9 13h6'], c: [[12, 13, 7]] },
  drop: { p: ['M12 4l6 8a6 6 0 1 1 -12 0z'] },
  bath: { p: ['M4 12h16v3a4 4 0 0 1 -4 4H8a4 4 0 0 1 -4 -4z', 'M8 12V7a2 2 0 0 1 4 0'] },
  med: { p: ['M12 8v8', 'M8 12h8'], c: [[12, 12, 8]] },
  ball: { p: ['M12 4v16', 'M4 12h16'], c: [[12, 12, 8]] },
  cap: { p: ['M4 14a8 8 0 0 1 16 0z', 'M4 14h17'] },
  boat: { p: ['M5 15h14l-2 5H7z', 'M12 3v12', 'M12 5l5 8h-5'] },
  cake: { p: ['M5 12h14v8H5z', 'M12 5v4', 'M5 16h14'] },
  plant: { p: ['M7 14h10l-1 6H8z', 'M12 14V8', 'M12 9c3 0 4-2 4-4-3 0-4 2-4 4z'] },
  smile: { p: ['M9 14a4 4 0 0 0 6 0', 'M9 9.5v.5', 'M15 9.5v.5'], c: [[12, 12, 8]] },
  kite: { p: ['M12 4l6 7-6 7-6-7z', 'M12 18v3'] },
  paw: {
    p: ['M8 15c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5-1.8 4-4 4-4-1.8-4-4z'],
    c: [[7.5, 8.5, 1.8], [12, 6.8, 1.8], [16.5, 8.5, 1.8]],
  },

  // цели
  scooter: { p: ['M6 17h6l4-9h3', 'M16 8h-3'], c: [[5, 17, 2.4], [18, 17, 2.4]] },
  house: { p: ['M4 11l8-6 8 6v8H4z', 'M9 19v-6h6v6', 'M12 5V3'] },
  telescope: { p: ['M4 14l11-6 3 5-11 6z', 'M9 16l-2 4', 'M14 14l3 6', 'M17 5l1-2'] },
  beach: { p: ['M4 19h16', 'M12 19v-7', 'M5 12a7 7 0 0 1 14 0z', 'M17 6l2-2'] },
  bike: { p: ['M7 17l4-8h4', 'M11 9l4 8', 'M9 9h4'], c: [[6, 17, 3], [18, 17, 3]] },
  guitar: { p: ['M14 6l4-2-1 4', 'M13 8l-2 2', 'M11 10a4 4 0 1 0 3 6c1-2 3-2 3-5z'] },
  skates: { p: ['M6 5h5v9H6z', 'M6 14h8', 'M5 18h12'], c: [[8, 18, 1.4], [13, 18, 1.4]] },
  tent: { p: ['M3 19h18', 'M12 5L4 19', 'M12 5l8 14', 'M12 11l-4 8', 'M12 11l4 8'] },
  camera: { p: ['M4 8h4l1.5-2h5L16 8h4v11H4z'], c: [[12, 13, 3.6]] },
  puzzle: {
    p: [
      'M5 5h6v2a2 2 0 1 0 2 0V5h6v6h-2a2 2 0 1 0 0 2h2v6H5v-6h2a2 2 0 1 0 0-2H5z',
    ],
  },

  // продукты для заданий
  apple: { p: ['M12 7.5V4', 'M12 6c2.5 0 3.5-1.5 3.5-3C13.5 3 12 4.3 12 6z'], c: [[12, 14, 6.5]] },
  bread: { p: ['M5 10h14v8H5z', 'M5 13h14', 'M9 10v8'] },
  cup: { p: ['M7 8h10l-1.5 11H8.5z', 'M13 8V4'] },
  choco: { p: ['M6 6h12v12H6z', 'M12 6v12', 'M6 12h12'] },
  bun: { p: ['M5 16h14a7 7 0 0 0 -14 0z', 'M5 16h14', 'M10 12v.5', 'M14 12v.5'] },

  // понятия
  calendar: { p: ['M4 7h16v13H4z', 'M4 11h16', 'M9 4v4', 'M15 4v4'] },
  hourglass: { p: ['M7 4h10', 'M7 20h10', 'M8 4c0 5 8 5 8 16', 'M16 4c0 5-8 5-8 16'] },
  receipt: { p: ['M6 4h12v16l-3-2-3 2-3-2-3 2z', 'M9 9h6', 'M9 13h6'] },
  target: { p: ['M12 12h0'], c: [[12, 12, 8], [12, 12, 4], [12, 12, 1]] },
  scales: { p: ['M12 5v14', 'M6 19h12', 'M4 9h16', 'M4 9l-2 5h4z', 'M20 9l-2 5h4z'] },
}

export function Icon({
  name,
  size = 24,
  color = 'currentColor',
  width = 2.2,
}: {
  name: IconName
  size?: number
  color?: string
  width?: number
}) {
  // неизвестное имя просто не рисуем
  const shape = SHAPES[name]
  if (!shape) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape.p?.map((d) => (
        <path key={d} d={d} />
      ))}
      {shape.c?.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  )
}
