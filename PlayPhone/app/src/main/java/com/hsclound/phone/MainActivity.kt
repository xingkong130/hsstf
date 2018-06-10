package com.hsclound.phone

import android.content.Context
import android.content.Intent
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import com.hsclound.phone.action.DeviceAction
import com.hsclound.phone.bean.BindDeviceResult
import com.hsclound.phone.bean.DeviceResult
import com.hsclound.phone.bean.UserData
import com.hsclound.phone.net.DeviceApi
import com.hsclound.phone.util.SharedPreferencesUtil
import kotlinx.android.synthetic.main.activity_main.*


class MainActivity : AppCompatActivity(), DeviceAction {


    private var userData: UserData? = null
    private var deviceApi: DeviceApi? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        userData = getUserData()
        Log.d(TAG, userData.toString())
        deviceApi = DeviceApi(this)
        deviceApi!!.getDevice(this)


        btnBindDevice.setOnClickListener({
            Log.d(TAG, "user--->" + userData.toString())
            deviceApi!!.bindDevice(userData!!, this)
        })

        btnOpenCloudPhone.setOnClickListener {
            Toast.makeText(this, "没有可用设备", Toast.LENGTH_SHORT).show()
        }


        btnLogout.setOnClickListener({
            SharedPreferencesUtil.saveData(this, LoginActivity.JWT_KEY, "")
            finish()
        })
    }

    override fun onGetDevices(deviceResult: DeviceResult) {
        Log.d(TAG, "get device ${deviceResult.success} + count ${deviceResult.devices!!.size}")
        if (deviceResult.devices!!.isEmpty()) {
            Toast.makeText(this, "请先绑定一个云手机", Toast.LENGTH_SHORT).show()
        } else if (deviceResult.devices!!.isNotEmpty()) {
            btnOpenCloudPhone.setOnClickListener {
                val display = deviceResult.devices!![0].display!!
                Log.d(TAG, "display ${display.toString()}")
                PhoneViewActivity.starter(this, userData!!.jwt, deviceResult.devices!![0])
            }
        }
    }

    override fun onBindDevices(bindDeviceResult: BindDeviceResult) {
        if (bindDeviceResult.success) {
            deviceApi!!.getDevice(this)
        }
    }

    override fun onBindDeviceError(msg: String) {
        Toast.makeText(this, "绑定设备失败 $msg", Toast.LENGTH_SHORT).show()
    }

    private fun getUserData(): UserData {
        return intent!!.getSerializableExtra(USER_DATA) as UserData
    }

    companion object {
        private const val TAG: String = "MainActivity";

        const val USER_DATA = "user_data_key"
        fun starter(ctx: Context, userData: UserData) {
            val intent = Intent(ctx, MainActivity::class.java)
            intent.putExtra(USER_DATA, userData)
            ctx.startActivity(intent)
        }
    }
}
