package com.hsclound.phone

import android.content.Context
import android.content.Intent
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.widget.Toast
import com.hsclound.phone.action.RegisterViewAction
import com.hsclound.phone.bean.User
import com.hsclound.phone.bean.UserData
import com.hsclound.phone.net.RegisterApi
import com.hsclound.phone.util.SharedPreferencesUtil
import kotlinx.android.synthetic.main.activity_register.*

class RegisterActivity : AppCompatActivity(), RegisterViewAction {


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        btnRegister.setOnClickListener({
            register()
        })
    }


    override fun onRegister(userData: UserData) {
        SharedPreferencesUtil.saveData(this, LoginActivity.JWT_KEY, userData.jwt)
        SharedPreferencesUtil.saveData(this, LoginActivity.USER_NAME, userData.userid)
        MainActivity.starter(this, userData)
        finish()
    }


    private fun register() {
        val userName = edUserName.text.toString()
        val password1 = edPassword1.text.toString()
        val password2 = edPassword2.text.toString()

        if (!userName.isEmpty() && !password1.isEmpty() && !password2.isEmpty()) {
            if (password1 != password2) {
                Toast.makeText(this, "两次输入的密码必须一致", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(this, "用户名或密码不能为空", Toast.LENGTH_SHORT).show()
        }
        val user = User()
        user.name = userName
        user.pwd = password1
        RegisterApi(this).registerUser(user, this)
    }


    companion object {
        private const val TAG: String = "RegisterActivity";

        fun starter(ctx: Context) {
            val intent = Intent(ctx, RegisterActivity::class.java)
            ctx.startActivity(intent)
        }
    }

}
