package com.hsclound.phone

import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Point
import android.os.Bundle
import android.support.v7.app.AppCompatActivity
import android.util.Log
import android.view.SurfaceHolder
import android.view.View
import android.view.Window
import android.view.WindowManager
import com.hsclound.phone.bean.Devices
import com.hsclound.phone.net.AudioService
import com.hsclound.phone.net.ScreenService
import com.hsclound.phone.util.TouchUtil
import com.hsclound.phone.view.TouchSurfaceView
import kotlinx.android.synthetic.main.activity_phone_view.*

class PhoneViewActivity : AppCompatActivity()
        , TouchSurfaceView.EventListener
        , View.OnLongClickListener
        , SurfaceHolder.Callback {


    private var point: Point? = null

    private var touchUtil: TouchUtil? = null

    private var devices: Devices? = null

    private var audioService: AudioService? = null

    private var screenService: ScreenService? = null;

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN)

        setContentView(R.layout.activity_phone_view)

        svScreenView.setOnLongClickListener(this)

        svScreenView.setListener(this)

        svScreenView.holder.addCallback(this)

        devices = getDisplayData()
        initTouchUtil()
        audioService = AudioService(devices!!);
        audioService!!.init();
    }


    private fun initTouchUtil() {
        point = Point()
        windowManager.defaultDisplay.getSize(point)
        touchUtil = TouchUtil(devices!!.channel!!, this)
        touchUtil!!.point = point
        touchUtil!!.init("${devices!!.display!!.touchurl}&jwt=${getJWT()}")
    }

    override fun onDestroy() {
        Log.d(TAG,"onDestroy.........")
        super.onDestroy()
        audioService!!.closeAudio()
    }

    override fun onConfigurationChanged(newConfig: Configuration?) {
        super.onConfigurationChanged(newConfig)
//        point = Point()
        windowManager.defaultDisplay.getSize(point)
        Log.d(TAG, "${point!!.x}  x  ${point!!.y}");
//        touchUtil!!.point = point
        when (newConfig!!.orientation) {
            Configuration.ORIENTATION_PORTRAIT -> {//竖屏幕
                Log.d(TAG, "---------------->0")
                touchUtil!!.rotaion = 0
                touchUtil!!.sendDisplayRotate(0)
            }
            Configuration.ORIENTATION_LANDSCAPE -> {//横屏幕
                Log.d(TAG, "---------------->90")
                touchUtil!!.rotaion = 90
                touchUtil!!.sendDisplayRotate(90)
            }
        }
    }


    override fun surfaceChanged(holder: SurfaceHolder?, format: Int, width: Int, height: Int) {
        Log.d(TAG, "surfaceChanged $width  x $height")
    }

    override fun surfaceDestroyed(holder: SurfaceHolder?) {
        Log.d(TAG,"surfaceDestroyed.........")
        screenService!!.close()
        audioService!!.closeAudio()
    }

    override fun surfaceCreated(holder: SurfaceHolder?) {
        Log.d(TAG,"surfaceCreated.........")

        screenService = ScreenService(devices!!, holder!!)
        screenService!!.init()
        screenService!!.sendOn(point!!)
        audioService!!.sendAudioOn()
    }

    override fun firstDown(x: Float, y: Float) {
        touchUtil!!.sendFirstDownEvent(x, y)
    }

    override fun secondDown(x: Float, y: Float) {
        touchUtil!!.sendSecondDownEvent(x, y)
    }

    override fun firstMove(x: Float, y: Float) {
        touchUtil!!.sendFirstMoveEvent(x, y)
    }

    override fun secondMove(x: Float, y: Float) {
        touchUtil!!.sendSecondMoveEvent(x, y)
    }

    override fun firstUp() {
        touchUtil!!.sendFirstUpEvent();
    }

    override fun secondUp() {
        touchUtil!!.sendSecondUpEvent()
    }

    override fun touchEnd() {
        touchUtil!!.sendGestureStop()
    }

    override fun onLongClick(v: View?): Boolean {
        return true;
    }


    private fun getDisplayData(): Devices {
        return intent!!.getSerializableExtra(KEY_DISPLAY_NAME) as Devices
    }

    private fun getJWT(): String? {
        return intent!!.getStringExtra(JWT_KEY_TOKEN)
    }

    companion object {
        val TAG = PhoneViewActivity::class.java.simpleName!!
        const val KEY_DISPLAY_NAME = "key_display_name";
        const val JWT_KEY_TOKEN = "jwt_key_token";

        fun starter(ctx: Context, jwt: String, devices: Devices) {
            val intent = Intent(ctx, PhoneViewActivity::class.java)
            intent.putExtra(JWT_KEY_TOKEN, jwt)
            intent.putExtra(KEY_DISPLAY_NAME, devices)
            ctx.startActivity(intent)
        }
    }
}
