package com.hsclound.phone.action

import com.hsclound.phone.bean.DeviceResult
import com.hsclound.phone.bean.UserData

interface LoginViewAction {
    fun onLogin(userData: UserData)

    fun onLogout()


    fun onLoginError(msg: String)
}