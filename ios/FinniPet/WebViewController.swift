import UIKit
import WebKit

final class WebViewController: UIViewController {

    private var webView: WKWebView!
    private let store = ProfileStore()
    private var bridge: NativeBridge!

    // MARK: - Жизненный цикл

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = UIColor(named: "PaperBackground") ?? .white
        setUpWebView()
        loadApp()

        // краевой свайп вместо аппаратной «Назад»
        let edge = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(handleEdgeSwipe))
        edge.edges = .left
        view.addGestureRecognizer(edge)

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applyTextScale),
            name: UIContentSizeCategory.didChangeNotification,
            object: nil
        )
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .lightContent
    }

    // MARK: - Настройка

    private func setUpWebView() {
        let configuration = WKWebViewConfiguration()

        guard let handler = AssetSchemeHandler() else {
            showMissingBundleMessage()
            return
        }
        configuration.setURLSchemeHandler(handler, forURLScheme: AssetSchemeHandler.scheme)

        // до загрузки страницы, иначе первый экран их не увидит
        let controller = WKUserContentController()
        controller.addUserScript(makeInjectionScript())

        bridge = NativeBridge(store: store, host: self)
        controller.add(bridge, name: NativeBridge.name)
        configuration.userContentController = controller

        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = .all

        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = UIColor(named: "PaperBackground") ?? .white

        webView.scrollView.bounces = false
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.allowsBackForwardNavigationGestures = false

        view.addSubview(webView)
        applyTextScale()
    }

    private func makeInjectionScript() -> WKUserScript {
        let info: [String: Any] = [
            "versionName": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0",
            "versionCode": Int(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1") ?? 1,
            "packageName": Bundle.main.bundleIdentifier ?? "ru.mosfin.finnipet",
            "platform": "ios",
        ]

        let infoJSON = Self.json(from: info) ?? "{}"
        let profileJSON = Self.jsonString(store.read())

        let source = """
        window.FinniAppInfo = \(infoJSON);
        window.FinniNativeStorage = true;
        window.FinniSavedProfile = \(profileJSON);
        """

        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    }

    private func loadApp() {
        guard webView != nil else { return }
        webView.load(URLRequest(url: AssetSchemeHandler.startURL))
    }

    // MARK: - Возврат

    @objc private func handleEdgeSwipe(_ recognizer: UIScreenEdgePanGestureRecognizer) {
        guard recognizer.state == .ended else { return }
        webView.evaluateJavaScript("window.finniHandleBack && window.finniHandleBack()")
    }

    // MARK: - Масштаб текста

    /// Аналог textZoom на Android. Масштабируется вся страница, т.к. вёрстка в px.
    @objc private func applyTextScale() {
        guard let webView else { return }
        webView.pageZoom = Self.zoom(for: UIApplication.shared.preferredContentSizeCategory)
    }

    static func zoom(for category: UIContentSizeCategory) -> CGFloat {
        switch category {
        case .extraSmall, .small: return 0.95
        case .medium, .large: return 1.0
        case .extraLarge: return 1.1
        case .extraExtraLarge: return 1.2
        case .extraExtraExtraLarge: return 1.3
        default:
            // выше 1.5 интерфейс не помещается
            return category.isAccessibilityCategory ? 1.5 : 1.0
        }
    }

    // MARK: - Очистка данных

    func wipeWebsiteDataAndReload() {
        let types = WKWebsiteDataStore.allWebsiteDataTypes()
        WKWebsiteDataStore.default().removeData(
            ofTypes: types,
            modifiedSince: Date(timeIntervalSince1970: 0)
        ) { [weak self] in
            guard let self else { return }
            // снимок профиля внедряется при загрузке, поэтому load, а не reload
            self.webView.configuration.userContentController.removeAllUserScripts()
            self.webView.configuration.userContentController.addUserScript(self.makeInjectionScript())
            self.loadApp()
        }
    }

    private func showMissingBundleMessage() {
        let label = UILabel(frame: view.bounds)
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        label.numberOfLines = 0
        label.textAlignment = .center
        label.text = """
        Не найден собранный веб-слой.

        Соберите его перед запуском:
            cd web
            npm ci
            npm run build
        """
        view.addSubview(label)
    }

    // MARK: - Вспомогательное

    private static func json(from object: Any) -> String? {
        guard let data = try? JSONSerialization.data(withJSONObject: object) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private static func jsonString(_ value: String?) -> String {
        guard let value else { return "null" }
        guard
            let data = try? JSONSerialization.data(withJSONObject: [value]),
            let wrapped = String(data: data, encoding: .utf8)
        else { return "null" }
        return String(wrapped.dropFirst().dropLast())
    }
}

// MARK: - WKNavigationDelegate

extension WebViewController: WKNavigationDelegate {

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        let allowed = navigationAction.request.url?.scheme == AssetSchemeHandler.scheme
        decisionHandler(allowed ? .allow : .cancel)
    }
}
