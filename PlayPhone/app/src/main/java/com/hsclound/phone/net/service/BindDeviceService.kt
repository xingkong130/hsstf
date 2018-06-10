package com.hsclound.phone.net.service

import com.hsclound.phone.bean.BindDeviceResult
import com.hsclound.phone.bean.UserData
import io.reactivex.Observable
import okhttp3.ResponseBody
import retrofit2.http.Body
import retrofit2.http.POST

interface BindDeviceService {
    @POST("/api/v1/user/binddevice")
    fun binDevice(@Body userdata: UserData): Observable<BindDeviceResult>
}