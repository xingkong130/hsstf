package com.hsclound.phone.net

import android.content.Context
import android.util.Log
import com.hsclound.phone.net.service.TokenService
import io.reactivex.android.schedulers.AndroidSchedulers
import io.reactivex.schedulers.Schedulers

class TokenApi : BaseApi() {
    val TAG = "TokenApi"
    fun getToken(ctx: Context) {
        val tokenApi = TokenApi()
        tokenApi.exec<TokenService>(ctx)
                .getToken()
                .subscribeOn(Schedulers.newThread())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe({
                    Log.d(TAG, it.toString())
                }, {
                    Log.e(TAG, it.message + "---")
                }, {
                    Log.d(TAG, "complete")
                })
    }
}