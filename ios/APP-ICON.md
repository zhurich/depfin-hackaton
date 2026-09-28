# Иконка приложения для iOS

Нужно положить **`AppIcon-1024.png`** (1024 × 1024) в
`FinniPet/Assets.xcassets/AppIcon.appiconset/`.

Требования Apple: без прозрачности и без скруглённых углов — iOS скругляет сама.

Файла в репозитории нет намеренно: это растр, а вся графика проекта векторная и
описана кодом (см. [../docs/LICENSES.md](../docs/LICENSES.md)).

## Откуда взять

Источник тот же, что у иконки Android, — мордочка Финни с монеткой:
[`ic_launcher_foreground.xml`](../android/app/src/main/res/drawable/ic_launcher_foreground.xml)
на фоне `#EDE6F7`.

Варианты экспорта:

1. **Из Android Studio** — Resource Manager → `ic_launcher` → Export → PNG
   1024 × 1024, затем подложить фон `#EDE6F7`.
2. **Вручную** — перерисовать тот же вектор в редакторе и экспортировать в PNG.

Без этого файла приложение собирается и запускается, но Xcode выдаёт
предупреждение, а публикация в App Store невозможна.
