package com.hsclound.phone.net

import android.util.Log
import com.hsclound.phone.bean.Devices
import com.hsclound.phone.bean.Frame
import com.hsclound.phone.util.FramePool
import com.hsclound.phone.util.PlayAacAudioThread
import okhttp3.*
import okio.ByteString
import java.util.concurrent.TimeUnit

class AudioService(val devices: Devices) : WebSocketListener() {

    private var audioSocket: WebSocket? = null

    private var playAacAudioThread: PlayAacAudioThread? = null

    private var pool: FramePool? = null;
    fun init() {
        pool = FramePool()
        playAacAudioThread = PlayAacAudioThread(pool)
        val client = OkHttpClient()
                .newBuilder()
                .connectTimeout(50, TimeUnit.SECONDS)
                .readTimeout(50, TimeUnit.SECONDS)
                .build()
        val request = Request
                .Builder()
                .url(devices.display!!.audiourl!!)
                .build();
        audioSocket = client.newWebSocket(request, this)
    }

    fun closeAudio() {
        audioSocket!!.send("off")
    }

    fun sendAudioOn(){
        Log.d(TAG,"audio on -------------")
        audioSocket!!.send("on")
    }

    override fun onOpen(webSocket: WebSocket?, response: Response?) {
        Log.d(TAG, "on audio")
        webSocket!!.send("on")
    }

    override fun onMessage(webSocket: WebSocket, text: String) {
        Log.d(TAG, "onMessage text $text")
    }

    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
        webSocket.send("off")
        Log.d(TAG, "onClosed code:$code reason:$reason")
    }

    override fun onFailure(webSocket: WebSocket?, t: Throwable?, response: Response?) {
        Log.e(TAG, "onFailure:${t!!.message}")
    }

    override fun onMessage(webSocket: WebSocket?, bytes: ByteString?) {
        try {
            val frame = Frame()
            frame.data = bytes!!.toByteArray()
            pool!!.pool.put(frame)
        } catch (e: InterruptedException) {
            e.printStackTrace()
        }
        if (!playAacAudioThread!!.isAlive)
            playAacAudioThread!!.start()
    }

    companion object {
        val TAG = "AudioService"
    }
}