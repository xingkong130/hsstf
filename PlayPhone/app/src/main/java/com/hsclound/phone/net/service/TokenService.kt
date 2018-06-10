package com.hsclound.phone.net.service

import io.reactivex.Observable
import okhttp3.ResponseBody
import retrofit2.http.GET

interface TokenService {
    @GET("/auth/mock")
    fun getToken(): Observable<ResponseBody>
}