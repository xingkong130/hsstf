package com.hsclound.phone

import android.os.Bundle
import android.os.Handler
import android.support.v7.app.AppCompatActivity
import com.hsclound.phone.bean.UserData
import com.hsclound.phone.util.SharedPreferencesUtil


class WelcomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_welecome)

        Handler().postDelayed({
            val jwt: String = SharedPreferencesUtil.getData(this, LoginActivity.JWT_KEY, "") as String
            if (!jwt.isEmpty()) {
                val userData = UserData()
                userData.jwt = jwt
                userData.userid = SharedPreferencesUtil.getData(this, LoginActivity.USER_NAME, "") as String
                MainActivity.starter(this, userData)
            } else {
                LoginActivity.starter(this)
            }
            runOnUiThread { finish() }
        }, 1000 * 3)
    }


}
