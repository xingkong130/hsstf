package com.hsclound.phone.net

import android.graphics.Point
import android.util.Log
import android.view.SurfaceHolder
import com.hsclound.phone.PhoneViewActivity
import com.hsclound.phone.bean.Devices
import com.hsclound.phone.bean.Frame
import com.hsclound.phone.util.DataPool
import com.hsclound.phone.util.DrawImgThread
import okhttp3.*
import okio.ByteString
import java.util.concurrent.TimeUnit

class ScreenService(private val devices: Devices
                    , private val holder: SurfaceHolder) {

    var screenSocket: WebSocket? = null;

    val pool = DataPool()

    fun init() {
        val client = OkHttpClient()
                .newBuilder()
                .connectTimeout(50, TimeUnit.SECONDS)
                .readTimeout(50, TimeUnit.SECONDS)
                .build()
        val request = Request
                .Builder()
                .url(devices.display!!.screenurl!!)
                .build();

        val dit = DrawImgThread(pool, holder)
        screenSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket?, response: Response?) {
                Log.d(PhoneViewActivity.TAG, "onOpen")
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "onMessage text $text")
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "onClosed code:$code reason:$reason")
            }

            override fun onFailure(webSocket: WebSocket?, t: Throwable?, response: Response?) {
                Log.e(TAG, "onFailure:${t!!.message}")
            }

            override fun onMessage(webSocket: WebSocket?, bytes: ByteString?) {
                try {
                    val frame = Frame()
                    frame.data = bytes!!.toByteArray()
                    pool.pool.put(frame)
                } catch (e: InterruptedException) {
                    e.printStackTrace()
                }
                if (pool.poolCount > 1)
                    if (!dit.isAlive)
                        dit.start()

            }
        })
    }

    fun sendOn(point: Point) {
        screenSocket!!.send("on")
//        screenSocket!!.send("size " + point.x + "x" + point.y) 256*384
//        screenSocket!!.send("size " + 256 + "x" + 384)
        screenSocket!!.send("size " + 384 + "x" + 640)
    }

    fun close() {
        screenSocket!!.send("off")
    }

    companion object {
        val TAG = "ScreenService";
    }
}