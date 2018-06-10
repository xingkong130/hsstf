package com.hsclound.phone.net

import android.content.Context
import android.util.Log
import com.hsclound.phone.action.RegisterViewAction
import com.hsclound.phone.bean.User
import com.hsclound.phone.net.service.LoginService
import com.hsclound.phone.net.service.RegisterService
import io.reactivex.android.schedulers.AndroidSchedulers
import io.reactivex.schedulers.Schedulers


class RegisterApi(val registerViewAction: RegisterViewAction) : BaseApi() {
    val TAG = "RegisterApi"
    fun registerUser(user: User, ctx: Context) {
        this.exec<RegisterService>(ctx)
                .register(user)
                .subscribeOn(Schedulers.newThread())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe({
                    Log.d(TAG, it.toString())
                    registerViewAction.onRegister(it)
                }, {
                    Log.e(TAG, it.message + "---")
                }, {
                    Log.d(TAG, "complete")
                })
    }
}