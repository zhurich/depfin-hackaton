import Foundation
import WebKit

/// Аналог WebViewAssetLoader: на file:// WebKit ограничивает хранилище, а http/https переопределить нельзя.
final class AssetSchemeHandler: NSObject, WKURLSchemeHandler {

    static let scheme = "finni-assets"
    static let host = "app"

    static var startURL: URL {
        URL(string: "\(scheme)://\(host)/index.html")!
    }

    private let root: URL

    /// Ответ отменённой задаче роняет процесс.
    private var activeTasks = Set<ObjectIdentifier>()
    private let lock = NSLock()

    init?(bundle: Bundle = .main) {
        guard let root = bundle.url(forResource: "www", withExtension: nil) else { return nil }
        self.root = root
    }

    // MARK: - WKURLSchemeHandler

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        let id = ObjectIdentifier(urlSchemeTask)
        lock.lock(); activeTasks.insert(id); lock.unlock()

        guard
            let url = urlSchemeTask.request.url,
            let fileURL = resolve(url: url),
            let data = try? Data(contentsOf: fileURL)
        else {
            finish(urlSchemeTask, id: id, failure: URLError(.fileDoesNotExist))
            return
        }

        let response = URLResponse(
            url: url,
            mimeType: Self.mimeType(for: fileURL.pathExtension),
            expectedContentLength: data.count,
            textEncodingName: nil
        )

        guard isActive(id) else { return }
        urlSchemeTask.didReceive(response)

        guard isActive(id) else { return }
        urlSchemeTask.didReceive(data)

        finish(urlSchemeTask, id: id, failure: nil)
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        let id = ObjectIdentifier(urlSchemeTask)
        lock.lock(); activeTasks.remove(id); lock.unlock()
    }

    // MARK: - Внутреннее

    private func isActive(_ id: ObjectIdentifier) -> Bool {
        lock.lock(); defer { lock.unlock() }
        return activeTasks.contains(id)
    }

    private func finish(_ task: WKURLSchemeTask, id: ObjectIdentifier, failure: Error?) {
        guard isActive(id) else { return }
        lock.lock(); activeTasks.remove(id); lock.unlock()

        if let failure {
            task.didFailWithError(failure)
        } else {
            task.didFinish()
        }
    }

    private func resolve(url: URL) -> URL? {
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }

        let segments = path.split(separator: "/").filter { $0 != ".." && $0 != "." }
        guard !segments.isEmpty else { return nil }

        let candidate = segments.reduce(root) { $0.appendingPathComponent(String($1)) }

        let resolvedRoot = root.standardizedFileURL.resolvingSymlinksInPath().path
        let resolved = candidate.standardizedFileURL.resolvingSymlinksInPath().path
        guard resolved == resolvedRoot || resolved.hasPrefix(resolvedRoot + "/") else { return nil }

        return FileManager.default.fileExists(atPath: resolved) ? candidate : nil
    }

    static func mimeType(for pathExtension: String) -> String {
        switch pathExtension.lowercased() {
        case "html", "htm": return "text/html"
        case "js", "mjs": return "text/javascript"
        case "css": return "text/css"
        case "json": return "application/json"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "ico": return "image/x-icon"
        case "txt": return "text/plain"
        default: return "application/octet-stream"
        }
    }
}
