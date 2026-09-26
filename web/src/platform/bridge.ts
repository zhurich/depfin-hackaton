// Мост к нативной оболочке. iOS не умеет возвращать значения из postMessage,
// поэтому данные для чтения оболочка кладёт в window заранее, а команды
// уходят без ответа.

export type Platform = 'android' | 'ios' | 'web'

export interface AppInfo {
  versionName: string
  versionCode: number
  packageName: string
  platform: Platform
  native: boolean
}

type NativeCommand =
  | { type: 'clearAllData' }
  | { type: 'saveProfile'; payload: string }
  | { type: 'clearProfile' }

interface AndroidApi {
  appInfo(): string
  postMessage(json: string): void
}

declare global {
  interface Window {
    FinniNative?: AndroidApi
    webkit?: { messageHandlers?: Record<string, { postMessage(body: unknown): void }> }
    FinniAppInfo?: Partial<AppInfo>
    // iOS: профиль с диска, подставляется до загрузки страницы
    FinniSavedProfile?: string | null
    FinniNativeStorage?: boolean
    // true — назад обработан веб-слоем
    finniHandleBack?: () => boolean
  }
}

const WEB_FALLBACK: AppInfo = {
  versionName: import.meta.env.MODE === 'production' ? '1.0.0' : 'dev',
  versionCode: 0,
  packageName: 'ru.mosfin.finnipet',
  platform: 'web',
  native: false,
}

export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'
  if (window.FinniAppInfo?.platform === 'ios') return 'ios'
  if (typeof window.webkit?.messageHandlers?.finni?.postMessage === 'function') return 'ios'
  if (typeof window.FinniNative?.appInfo === 'function') return 'android'
  return 'web'
}

export function isNative(): boolean {
  return detectPlatform() !== 'web'
}

export function getAppInfo(): AppInfo {
  if (typeof window === 'undefined') return WEB_FALLBACK

  if (window.FinniAppInfo) {
    return { ...WEB_FALLBACK, ...window.FinniAppInfo, native: true }
  }

  if (typeof window.FinniNative?.appInfo === 'function') {
    try {
      const parsed = JSON.parse(window.FinniNative.appInfo()) as Partial<AppInfo>
      return { ...WEB_FALLBACK, ...parsed, platform: 'android', native: true }
    } catch {
      return { ...WEB_FALLBACK, platform: 'android', native: true }
    }
  }

  return WEB_FALLBACK
}

export function sendCommand(command: NativeCommand): boolean {
  if (typeof window === 'undefined') return false
  try {
    const ios = window.webkit?.messageHandlers?.finni
    if (ios) {
      ios.postMessage(command)
      return true
    }
    if (typeof window.FinniNative?.postMessage === 'function') {
      window.FinniNative.postMessage(JSON.stringify(command))
      return true
    }
  } catch {
    // ignore
  }
  return false
}

export function requestNativeWipe(): boolean {
  return sendCommand({ type: 'clearAllData' })
}

export function hasNativeStorage(): boolean {
  return typeof window !== 'undefined' && window.FinniNativeStorage === true
}

export function registerBackHandler(handler: () => boolean): () => void {
  window.finniHandleBack = handler
  return () => {
    if (window.finniHandleBack === handler) delete window.finniHandleBack
  }
}
