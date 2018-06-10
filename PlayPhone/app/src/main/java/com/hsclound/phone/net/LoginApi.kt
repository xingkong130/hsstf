package com.hsclound.phone.net

import android.content.Context
import android.util.Log
import com.hsclound.phone.action.LoginViewAction
import com.hsclound.phone.action.MainViewAction
import com.hsclound.phone.bean.User
import com.hsclound.phone.net.service.LoginService
import io.reactivex.android.schedulers.AndroidSchedulers
import io.reactivex.schedulers.Schedulers


class LoginApi(private val viewAction: LoginViewAction) : BaseApi() {

    fun login(user: User, ctx: Context) {
        this.exec<LoginService>(ctx)
                .login(user)
                .subscribeOn(Schedulers.newThread())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe({
                    Log.d(TAG, it.toString())
                    viewAction.onLogin(it)
                }, {
                    Log.e(TAG, "${it.message}---")
                    viewAction.onLoginError(it.message!!)
                }, {
                    Log.d(TAG, "complete")
                })
    }


    companion object {
        const val TAG = "LoginApi"
    }
}