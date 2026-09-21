package ru.mosfin.finnipet

import android.webkit.JavascriptInterface
import org.json.JSONObject

class NativeBridge(private val activity: MainActivity) {

    companion object {
        const val NAME = "FinniNative"
    }

    @JavascriptInterface
    fun appInfo(): String = JSONObject()
        .put("versionName", BuildConfig.VERSION_NAME)
        .put("versionCode", BuildConfig.VERSION_CODE)
        .put("packageName", BuildConfig.APPLICATION_ID)
        .put("native", true)
        .toString()

    @JavascriptInterface
    fun clearAllData() {
        activity.wipeAndRestart()
    }
}
