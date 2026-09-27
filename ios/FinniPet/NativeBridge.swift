import Foundation
import WebKit

/// Команды веб-слоя. Ответить из обработчика нельзя, данные для чтения внедряются в window заранее.
final class NativeBridge: NSObject, WKScriptMessageHandler {

    static let name = "finni"

    private let store: ProfileStore
    private weak var host: WebViewController?

    init(store: ProfileStore, host: WebViewController) {
        self.store = store
        self.host = host
    }

    func userContentController(
        _ controller: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard
            message.name == Self.name,
            let body = message.body as? [String: Any],
            let type = body["type"] as? String
        else { return }

        switch type {
        case "saveProfile":
            if let payload = body["payload"] as? String {
                store.write(payload)
            }

        case "clearProfile":
            store.clear()

        case "clearAllData":
            store.clear()
            host?.wipeWebsiteDataAndReload()

        default:
            break
        }
    }
}
