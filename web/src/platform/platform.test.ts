// iOS-ветку проверяем подменой того, что внедряет WKWebView.
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  detectPlatform,
  getAppInfo,
  isNative,
  registerBackHandler,
  requestNativeWipe,
  sendCommand,
} from './bridge'
import {
  __resetNativeMirror,
  clearState,
  loadState,
  saveState,
  storageAvailable,
  storageKind,
} from './storage'
import { createInitialState } from '../domain/state'

function mockIos({ savedProfile = null as string | null } = {}) {
  const posted: unknown[] = []
  window.webkit = { messageHandlers: { finni: { postMessage: (b) => posted.push(b) } } }
  window.FinniAppInfo = {
    versionName: '1.0.0',
    versionCode: 1,
    packageName: 'ru.mosfin.finnipet',
    platform: 'ios',
  }
  window.FinniNativeStorage = true
  window.FinniSavedProfile = savedProfile
  return posted
}

function mockAndroid() {
  const posted: string[] = []
  window.FinniNative = {
    appInfo: () =>
      JSON.stringify({ versionName: '1.0.0', versionCode: 1, packageName: 'ru.mosfin.finnipet' }),
    postMessage: (json) => posted.push(json),
  }
  return posted
}

afterEach(() => {
  delete window.webkit
  delete window.FinniNative
  delete window.FinniAppInfo
  delete window.FinniNativeStorage
  delete window.FinniSavedProfile
  delete window.finniHandleBack
  __resetNativeMirror()
  localStorage.clear()
})

describe('определение оболочки', () => {
  it('в браузере платформа — web, и нативной оболочки нет', () => {
    expect(detectPlatform()).toBe('web')
    expect(isNative()).toBe(false)
  })

  it('узнаёт Android по внедрённому объекту', () => {
    mockAndroid()
    expect(detectPlatform()).toBe('android')
    expect(isNative()).toBe(true)
  })

  it('узнаёт iOS по обработчикам сообщений', () => {
    mockIos()
    expect(detectPlatform()).toBe('ios')
    expect(isNative()).toBe(true)
  })

  it('узнаёт iOS даже без внедрённых сведений о приложении', () => {
    window.webkit = { messageHandlers: { finni: { postMessage: () => {} } } }
    expect(detectPlatform()).toBe('ios')
  })
})

describe('сведения о приложении', () => {
  it('в браузере отдаёт запасные значения и не притворяется нативным', () => {
    const info = getAppInfo()
    expect(info.platform).toBe('web')
    expect(info.native).toBe(false)
    expect(info.packageName).toBe('ru.mosfin.finnipet')
  })

  it('на iOS берёт внедрённый объект', () => {
    mockIos()
    const info = getAppInfo()
    expect(info.platform).toBe('ios')
    expect(info.native).toBe(true)
    expect(info.versionName).toBe('1.0.0')
  })

  it('на Android читает синхронный вызов оболочки', () => {
    mockAndroid()
    const info = getAppInfo()
    expect(info.platform).toBe('android')
    expect(info.native).toBe(true)
    expect(info.versionCode).toBe(1)
  })

  it('не падает, если оболочка вернула не JSON', () => {
    window.FinniNative = { appInfo: () => 'не json', postMessage: () => {} }
    expect(getAppInfo().platform).toBe('android')
  })
})

describe('отправка команд', () => {
  it('на iOS уходит объектом в обработчик сообщений', () => {
    const posted = mockIos()
    expect(sendCommand({ type: 'clearAllData' })).toBe(true)
    expect(posted).toEqual([{ type: 'clearAllData' }])
  })

  it('на Android уходит строкой JSON', () => {
    const posted = mockAndroid()
    expect(requestNativeWipe()).toBe(true)
    expect(JSON.parse(posted[0])).toEqual({ type: 'clearAllData' })
  })

  it('в браузере команда не отправляется и это не ошибка', () => {
    expect(requestNativeWipe()).toBe(false)
  })

  it('исключение в оболочке не роняет приложение', () => {
    window.webkit = {
      messageHandlers: {
        finni: {
          postMessage: () => {
            throw new Error('оболочка отказала')
          },
        },
      },
    }
    expect(sendCommand({ type: 'clearAllData' })).toBe(false)
  })
})

describe('кнопка «назад»', () => {
  it('регистрируется и снимается', () => {
    const handler = vi.fn(() => true)
    const off = registerBackHandler(handler)

    expect(window.finniHandleBack).toBe(handler)
    expect(window.finniHandleBack!()).toBe(true)

    off()
    expect(window.finniHandleBack).toBeUndefined()
  })
})

describe('выбор хранилища', () => {
  it('в браузере профиль лежит в localStorage', () => {
    expect(storageKind()).toBe('browser')

    const state = createInitialState()
    state.playerName = 'Капитан'
    expect(saveState(state)).toBe(true)
    expect(loadState()?.playerName).toBe('Капитан')

    clearState()
    expect(loadState()).toBeNull()
  })

  it('на iOS профиль уходит в оболочку, а не в localStorage', () => {
    const posted = mockIos()
    expect(storageKind()).toBe('native')

    const state = createInitialState()
    state.playerName = 'Аня'
    expect(saveState(state)).toBe(true)

    const save = posted[0] as { type: string; payload: string }
    expect(save.type).toBe('saveProfile')
    expect(JSON.parse(save.payload).playerName).toBe('Аня')

    expect(localStorage.getItem('finni.profile.v1')).toBeNull()
  })

  it('на iOS профиль читается из снимка, внедрённого оболочкой', () => {
    const state = createInitialState()
    state.playerName = 'Из файла'
    mockIos({ savedProfile: JSON.stringify(state) })

    expect(loadState()?.playerName).toBe('Из файла')
  })

  it('на iOS запись сразу видна при повторном чтении', () => {
    mockIos({ savedProfile: null })
    expect(loadState()).toBeNull()

    const state = createInitialState()
    state.playerName = 'Записан'
    saveState(state)

    expect(loadState()?.playerName).toBe('Записан')
  })

  it('на iOS очистка стирает и снимок', () => {
    const state = createInitialState()
    mockIos({ savedProfile: JSON.stringify(state) })

    clearState()
    expect(loadState()).toBeNull()
  })

  it('испорченный профиль не мешает запуску', () => {
    localStorage.setItem('finni.profile.v1', '{это не json')
    expect(loadState()).toBeNull()
  })

  it('доступность хранилища сообщается для каждой оболочки', () => {
    expect(storageAvailable()).toBe(true)
    mockIos()
    expect(storageAvailable()).toBe(true)
  })
})
