package com.hsclound.phone.net.service

import com.hsclound.phone.bean.DeviceResult
import com.hsclound.phone.bean.UserData
import io.reactivex.Observable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface GetDeviceService {
    @GET("/api/v1/user/devices")
    fun getDevice(): Observable<DeviceResult>
}