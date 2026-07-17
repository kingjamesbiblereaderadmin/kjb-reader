package com.godisgracious1031m.kjbreader

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    // OAuth providers (Google, Apple, etc.) MUST stay inside the WebView — opening them
    // in Chrome logs the user into Chrome, not the app. Allow these to load in-app.
    private val authHosts = listOf(
        "accounts.google.com", "accounts.youtube.com", "appleid.apple.com",
        "apple.com", "icloud.com", "github.com", "login.microsoftonline.com",
        "facebook.com", "base44.com", "oauth.googleusercontent.com"
    )

    private fun isAllowedHost(host: String): Boolean {
        if (host == "kingjamesbiblereader.com" || host.endsWith(".kingjamesbiblereader.com")) return true
        return authHosts.any { host == it || host.endsWith(".$it") }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.mediaPlaybackRequiresUserGesture = false
            settings.javaScriptCanOpenWindowsAutomatically = true
            settings.setSupportMultipleWindows(true)
            // Google's OAuth flow rejects the default Android WebView user agent
            // ("disallowed_useragent"). Use a Chrome UA so sign-in completes in-app.
            settings.userAgentString = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            // Allow 3rd-party cookies so the OAuth popup can set its session cookie.
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) { super.onPageFinished(view, url); view?.evaluateJavascript("(function(){\n  fetch('https://appnative.base44.app/api/functions/checkWrapperSubscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({app_id:'6a3b173091fac51ec5838d18'})})\n  .then(function(r){return r.json()}).then(function(d){\n    if(d.active||document.getElementById('appnative-wrapper-banner'))return;\n    function openUpsell(){\n      if(document.getElementById('appnative-upsell'))return;\n      var o=document.createElement('div');o.id='appnative-upsell';\n      o.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(8,12,20,.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;';\n      var c=document.createElement('div');\n      c.style.cssText='background:#fff;color:#0f172a;border-radius:20px;max-width:360px;width:100%;padding:28px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);';\n      c.innerHTML='<div style=\"width:56px;height:56px;border-radius:16px;margin:0 auto 16px;background:linear-gradient(135deg,#4f46e5,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:28px\">📱</div>'\n        +'<h2 style=\"margin:0 0 8px;font-size:20px;font-weight:800\">Get Your Own Mobile App</h2>'\n        +'<p style=\"margin:0 0 20px;font-size:14px;line-height:1.5;color:#475569\">Launch your own branded iOS &amp; Android app on the App Store &amp; Google Play — no code, powered by AppNative.io.</p>'\n        +'<a href=\"https://appnative.io/\" target=\"_blank\" style=\"display:block;text-decoration:none;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:#fff;border-radius:12px;padding:14px;font-size:15px;font-weight:700;margin-bottom:10px\">Get Started →</a>'\n        +'<button id=\"appnative-upsell-close\" style=\"width:100%;background:transparent;border:none;color:#64748b;font-size:14px;font-weight:600;padding:8px;cursor:pointer\">Maybe later</button>';\n      o.appendChild(c);\n      o.addEventListener('click',function(e){if(e.target===o)o.remove()});\n      document.body.appendChild(o);\n      document.getElementById('appnative-upsell-close').onclick=function(){o.remove()};\n    }\n    var b=document.createElement('a');b.id='appnative-wrapper-banner';b.href='#';\n    b.textContent=d.banner_text||'This App Was Wrapped By AppNative.io';\n    b.style.cssText='display:block;text-decoration:none;cursor:pointer;position:fixed;top:0;left:0;right:0;z-index:2147483646;background:#0f172a;color:#fff;text-align:center;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:10px 12px;box-shadow:0 2px 12px rgba(0,0,0,.25);';\n    b.onclick=function(e){e.preventDefault();openUpsell()};\n    document.body.style.paddingTop='44px';document.body.appendChild(b);\n  }).catch(function(){})\n})();", null) }
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val url = request?.url ?: return false
                    val host = url.host ?: return false
                    // Keep app + OAuth provider pages inside the WebView
                    if (isAllowedHost(host)) return false
                    // Everything else opens in the external browser
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    return true
                }
            }
            // Google OAuth opens its consent screen in a popup window — load it in the
            // same WebView instead of letting it escape to Chrome.
            webChromeClient = object : WebChromeClient() {
                override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
                    val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                    transport.webView = view
                    resultMsg.sendToTarget()
                    return true
                }
            }
            loadUrl("https://kingjamesbiblereader.com/")
        }
        setContentView(webView)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}