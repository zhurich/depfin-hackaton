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
        .put("platform", "android")
        .toString()

    // saveProfile/clearProfile приходят только с iOS
    @JavascriptInterface
    fun postMessage(json: String) {
        val type = try {
            JSONObject(json).optString("type")
        } catch (_: Exception) {
            return
        }

        when (type) {
            "clearAllData" -> activity.wipeAndRestart()

            // неизвестная команда — веб-слой новее оболочки
            else -> Unit
        }
    }
}
