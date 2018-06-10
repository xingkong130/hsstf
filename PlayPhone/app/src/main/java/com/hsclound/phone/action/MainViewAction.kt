package com.hsclound.phone.action

import com.hsclound.phone.bean.DeviceResult
import com.hsclound.phone.bean.UserData

interface MainViewAction {
    fun onLogin(userData: UserData)

    fun onLogout()


    fun onGetDevices(deviceResult: DeviceResult)
}