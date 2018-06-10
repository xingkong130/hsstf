package com.hsclound.phone.action

import com.hsclound.phone.bean.BindDeviceResult
import com.hsclound.phone.bean.DeviceResult

interface DeviceAction {


    fun onGetDevices(deviceResult: DeviceResult);


    fun onBindDevices(bindDeviceResult: BindDeviceResult)


    fun onBindDeviceError(msg: String)
}