export interface AppInfo {
  versionName: string
  versionCode: number
  packageName: string
  native: boolean
}

interface NativeApi {
  appInfo(): string
  clearAllData(): void
}

declare global {
  interface Window {
    FinniNative?: NativeApi
    finniHandleBack?: () => boolean
  }
}

export function isNative(): boolean {
  return typeof window !== 'undefined' && typeof window.FinniNative?.appInfo === 'function'
}

export function getAppInfo(): AppInfo {
  const fallback: AppInfo = {
    versionName: import.meta.env.MODE === 'production' ? '1.0.0' : 'dev',
    versionCode: 0,
    packageName: 'ru.mosfin.finnipet',
    native: false,
  }
  if (!isNative()) return fallback
  try {
    const parsed = JSON.parse(window.FinniNative!.appInfo()) as Partial<AppInfo>
    return { ...fallback, ...parsed, native: true }
  } catch {
    return fallback
  }
}

export function requestNativeWipe(): boolean {
  if (!isNative()) return false
  try {
    window.FinniNative!.clearAllData()
    return true
  } catch {
    return false
  }
}

export function registerBackHandler(handler: () => boolean): () => void {
  window.finniHandleBack = handler
  return () => {
    if (window.finniHandleBack === handler) delete window.finniHandleBack
  }
}
