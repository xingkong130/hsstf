package com.hsclound.phone.bean

import java.io.Serializable

class DeviceResult : Serializable{
    var success: Boolean = false
    var devices: List<Devices>? = null
}