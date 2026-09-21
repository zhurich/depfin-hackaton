# minify выключен (ТЗ п. 7.2), правила на случай включения.

# методы моста вызываются из JS по имени
-keepclassmembers class ru.mosfin.finnipet.NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}
