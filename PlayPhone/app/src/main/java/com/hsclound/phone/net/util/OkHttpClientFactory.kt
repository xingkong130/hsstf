package com.hsclound.phone.net.util

import android.annotation.SuppressLint
import android.content.Context
import android.preference.Preference
import android.preference.PreferenceManager
import android.util.Log
import com.hsclound.phone.LoginActivity
import com.hsclound.phone.util.SharedPreferencesUtil
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import java.util.concurrent.TimeUnit

class OkHttpClientFactory(val ctx: Context) {

    val TAG = "OkHttpClientFactory";

    val KEY_PRECECE_COOKIE = "key_precece_cookie";


    fun getHttpClient(): OkHttpClient {
        return OkHttpClient()
                .newBuilder()
                .addNetworkInterceptor(WriteCookieIntercept())
                .addNetworkInterceptor(ReadCookieIntercept())
                .connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build()
    }


    inner class ReadCookieIntercept : Interceptor {
        @SuppressLint("CommitPrefEdits")
        override fun intercept(chain: Interceptor.Chain?): Response {
            val builder = chain!!.request().newBuilder()
            val cookies = PreferenceManager.getDefaultSharedPreferences(ctx).getStringSet(KEY_PRECECE_COOKIE, hashSetOf())
            if (!cookies.isEmpty()) {
                for (cookie in cookies) {
                    Log.d(TAG, "add $cookie");
                    builder.addHeader("Set-Cookie", cookie)
                }
            }
            builder.addHeader("authorization", "Bearer " + SharedPreferencesUtil.getData(ctx, LoginActivity.JWT_KEY, ""))
            var req = builder.build();
            Log.d(TAG, "header----:" + req.headers().toString())
            return chain.proceed(req)
        }
    }

    inner class WriteCookieIntercept : Interceptor {
        @SuppressLint("CommitPrefEdits")
        override fun intercept(chain: Interceptor.Chain?): Response {
            val originalResponse = chain!!.proceed(chain.request())
            if (!originalResponse.headers("Set-Cookie").isEmpty()) {
                val cookies = HashSet<String>()
                val editor = PreferenceManager.getDefaultSharedPreferences(ctx).edit()
                for (cookie in originalResponse.headers("Set-Cookie")) {
                    Log.d(TAG, "get $cookie");
                    cookies.add(cookie)
                }
                editor.putStringSet(KEY_PRECECE_COOKIE, cookies);
                editor.apply()
            }
            return originalResponse
        }

    }
}