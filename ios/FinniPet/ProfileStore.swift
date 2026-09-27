import Foundation

/// Профиль файлом в Application Support: localStorage на кастомной схеме ненадёжен.
final class ProfileStore {

    private let fileURL: URL
    private let queue = DispatchQueue(label: "ru.mosfin.finnipet.profile")

    init(fileManager: FileManager = .default) {
        let base = (try? fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )) ?? fileManager.temporaryDirectory

        let folder = base.appendingPathComponent("FinniPet", isDirectory: true)
        try? fileManager.createDirectory(at: folder, withIntermediateDirectories: true)

        self.fileURL = folder.appendingPathComponent("profile.json")
        excludeFromBackup(folder)
    }

    func read() -> String? {
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func write(_ json: String) {
        queue.async { [fileURL] in
            guard let data = json.data(using: .utf8) else { return }
            // атомарно, чтобы не оставить половину файла
            try? data.write(to: fileURL, options: .atomic)
        }
    }

    func clear() {
        queue.async { [fileURL] in
            try? FileManager.default.removeItem(at: fileURL)
        }
    }

    private func excludeFromBackup(_ url: URL) {
        var url = url
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try? url.setResourceValues(values)
    }
}
