package com.hsclound.phone

import android.content.Context
import android.content.Intent
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import com.hsclound.phone.action.LoginViewAction
import com.hsclound.phone.bean.User
import com.hsclound.phone.bean.UserData
import com.hsclound.phone.net.LoginApi
import com.hsclound.phone.util.SharedPreferencesUtil
import kotlinx.android.synthetic.main.activity_login.*

class LoginActivity : AppCompatActivity(), LoginViewAction, View.OnClickListener {


    private var userName: String? = null
    private var password: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)
        btnLogin.setOnClickListener(this)

        btnRegister.setOnClickListener({
            RegisterActivity.starter(this)
        })
    }

    override fun onClick(v: View?) {
        userName = edUserName.text.toString()
        password = edPassword.text.toString()
        if (userName!!.isEmpty() || password!!.isEmpty()) {
            Toast.makeText(this, "帐户或密码不能为空", Toast.LENGTH_SHORT).show()
        }
        val user = User()
        user.name = userName!!
        user.pwd = password!!
        LoginApi(this).login(user, this)
    }

    override fun onLogin(userData: UserData) {
        Log.d(TAG, "logined")
        SharedPreferencesUtil.saveData(this, JWT_KEY, userData.jwt)
        SharedPreferencesUtil.saveData(this, USER_NAME, userData.userid)
        MainActivity.starter(this, userData)
        finish()
    }

    override fun onLoginError(msg: String) {
        Toast.makeText(this, "登录错误，请联系客服人员", Toast.LENGTH_SHORT).show()
    }

    override fun onLogout() {

    }


    companion object {
        const val TAG = "LoginActivity"
        const val JWT_KEY = "jwt_key"
        const val USER_NAME = "cloud_phone_user_name"

        fun starter(ctx: Context) {
            val intent = Intent(ctx, LoginActivity::class.java)
            ctx.startActivity(intent)
        }
    }
}
