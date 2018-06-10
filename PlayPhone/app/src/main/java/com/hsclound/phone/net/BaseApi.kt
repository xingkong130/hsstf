package com.hsclound.phone.net

import android.content.Context
import com.hsclound.phone.net.util.OkHttpClientFactory
import retrofit2.Retrofit
import retrofit2.adapter.rxjava2.RxJava2CallAdapterFactory
import retrofit2.converter.gson.GsonConverterFactory

open class BaseApi {
//    val HOST = "http://mayl8822.vicp.net:7100";
    val HOST = "http://192.168.3.14:7100";

    inline fun <reified T> exec(ctx: Context): T {
        return Retrofit.Builder()
                .baseUrl(HOST)
                .addConverterFactory(GsonConverterFactory.create())
                .client(OkHttpClientFactory(ctx).getHttpClient())
                .addCallAdapterFactory(RxJava2CallAdapterFactory.create())
                .build().create(T::class.java)
    }
}