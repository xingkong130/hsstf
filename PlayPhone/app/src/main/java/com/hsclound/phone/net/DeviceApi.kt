package com.hsclound.phone.net

import android.content.Context
import android.util.Log
import com.hsclound.phone.action.DeviceAction
import com.hsclound.phone.action.MainViewAction
import com.hsclound.phone.bean.UserData
import com.hsclound.phone.net.service.BindDeviceService
import com.hsclound.phone.net.service.GetDeviceService
import io.reactivex.android.schedulers.AndroidSchedulers
import io.reactivex.schedulers.Schedulers

class DeviceApi(private val viewAction: DeviceAction) : BaseApi() {
    val TAG = "DeviceApi"
    fun getDevice(ctx: Context) {
        this.exec<GetDeviceService>(ctx)
                .getDevice()
                .subscribeOn(Schedulers.newThread())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe({
                    Log.d(TAG, it.toString())
                    viewAction.onGetDevices(it)
                }, {
                    Log.e(TAG, it.message + " ")
                }, {
                    Log.d(TAG, "complete")
                })
    }


    fun bindDevice(userData: UserData, ctx: Context) {
        this.exec<BindDeviceService>(ctx)
                .binDevice(userData)
                .subscribeOn(Schedulers.newThread())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe({
                    Log.d(TAG, it.toString())
                    viewAction.onBindDevices(it)
                }, {
                    Log.e(TAG, it.message)
                    viewAction.onBindDeviceError(it.message!!)
                }, {
                    Log.d(TAG, "complete")
                })
    }
}