package com.hsclound.phone.net.service

import com.hsclound.phone.bean.User
import com.hsclound.phone.bean.UserData
import io.reactivex.Observable
import okhttp3.ResponseBody
import retrofit2.http.Body
import retrofit2.http.POST

interface LoginService {
    @POST("/api/v1/user/login")
    fun login(@Body user: User) :Observable<UserData>
}