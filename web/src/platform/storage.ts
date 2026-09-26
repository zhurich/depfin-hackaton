// Android/браузер — localStorage. iOS — файл через оболочку: localStorage
// на кастомной схеме WKWebView ненадёжен.
import { hasNativeStorage, sendCommand } from './bridge'
import { migrate } from '../domain/state'
import type { GameState } from '../domain/types'

const KEY = 'finni.profile.v1'

interface Backend {
  kind: 'native' | 'browser'
  load(): string | null
  save(json: string): boolean
  clear(): void
  available(): boolean
}

const browserBackend: Backend = {
  kind: 'browser',
  load() {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  save(json) {
    try {
      localStorage.setItem(KEY, json)
      return true
    } catch {
      return false
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // ignore
    }
  },
  available() {
    try {
      const probe = '__finni_probe__'
      localStorage.setItem(probe, '1')
      localStorage.removeItem(probe)
      return true
    } catch {
      return false
    }
  },
}

// запись в оболочку без ответа, поэтому держим последнюю копию здесь
let nativeMirror: string | null | undefined

const nativeBackend: Backend = {
  kind: 'native',
  load() {
    if (nativeMirror !== undefined) return nativeMirror
    return window.FinniSavedProfile ?? null
  },
  save(json) {
    const sent = sendCommand({ type: 'saveProfile', payload: json })
    if (sent) nativeMirror = json
    return sent
  },
  clear() {
    sendCommand({ type: 'clearProfile' })
    nativeMirror = null
  },
  available() {
    return true
  },
}

function backend(): Backend {
  return hasNativeStorage() ? nativeBackend : browserBackend
}

export function loadState(): GameState | null {
  const raw = backend().load()
  if (!raw) return null
  try {
    return migrate(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveState(state: GameState): boolean {
  try {
    return backend().save(JSON.stringify(state))
  } catch {
    return false
  }
}

export function clearState(): void {
  backend().clear()
}

export function storageAvailable(): boolean {
  return backend().available()
}

export function storageKind(): 'native' | 'browser' {
  return backend().kind
}

// для тестов
export function __resetNativeMirror(): void {
  nativeMirror = undefined
}
