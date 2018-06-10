package com.hsclound.phone.net.service

import com.hsclound.phone.bean.User
import com.hsclound.phone.bean.UserData
import io.reactivex.Observable
import retrofit2.http.Body
import retrofit2.http.POST

interface RegisterService {
    @POST("/api/v1/user/register")
    fun register(@Body user: User) :Observable<UserData>
}