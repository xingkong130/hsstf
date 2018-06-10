package com.hsclound.phone.action

import com.hsclound.phone.bean.UserData

interface RegisterViewAction {

    fun onRegister(userData: UserData)
}