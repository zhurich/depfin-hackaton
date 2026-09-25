import { Component, type ErrorInfo, type ReactNode } from 'react'

import { clearState } from '../platform/storage'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
  detail: string | null
  confirming: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, detail: null, confirming: false }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { failed: true, detail: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Финни: не удалось отрисовать экран', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="screen">
        <main className="content" style={{ justifyContent: 'center' }}>
          <div className="card card--cream" style={{ textAlign: 'center' }}>
            <h1>Финни прилёг отдохнуть</h1>
            <p style={{ marginTop: 10 }}>
              Игра не смогла открыть экран. Прогресс сохранён — скорее всего, поможет перезапуск.
            </p>
          </div>

          <button className="btn btn--block" onClick={() => window.location.reload()}>
            Перезапустить игру
          </button>

          {!this.state.confirming ? (
            <button
              className="btn btn--quiet btn--block"
              onClick={() => this.setState({ confirming: true })}
            >
              Начать заново
            </button>
          ) : (
            <div className="card">
              <p>
                Начать заново — значит стереть питомца, финики и копилку. Это нельзя отменить.
              </p>
              <div className="stack" style={{ marginTop: 14 }}>
                <button
                  className="btn btn--danger btn--block"
                  onClick={() => {
                    clearState()
                    window.location.reload()
                  }}
                >
                  Да, начать заново
                </button>
                <button
                  className="btn btn--quiet btn--block"
                  onClick={() => this.setState({ confirming: false })}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {this.state.detail && (
            <details style={{ marginTop: 8 }}>
              <summary className="muted" style={{ cursor: 'pointer', minHeight: 48 }}>
                Подробности для взрослого
              </summary>
              <p className="muted" style={{ marginTop: 8, wordBreak: 'break-word' }}>
                {this.state.detail}
              </p>
            </details>
          )}
        </main>
      </div>
    )
  }
}
