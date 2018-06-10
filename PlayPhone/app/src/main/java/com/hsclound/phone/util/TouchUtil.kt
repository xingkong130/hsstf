package com.hsclound.phone.util

import android.content.Context
import android.content.res.Configuration
import android.graphics.Point
import android.util.Log
import io.socket.client.IO

import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject


/**
 * Created by budog on 18/5/18.
 */

class TouchUtil(private var channel: String, private val ctx: Context) {
    private var ioSocket: Socket? = null
    private var seq = -1;
    private var cycle = 100;
    var rotaion = 0;
    var point: Point? = null


    fun setIoSocket(ioSocket: Socket) {
        this.ioSocket = ioSocket
    }

    private inner class RealPointer {
        var realY: Float = 0f
        var realX: Float = 0f
    }

    private fun getRealPointer(x: Float, y: Float): RealPointer {
        val rp = RealPointer()
//        Log.d(TAG, x.toString() + " ----  " + y)
        var realY = 0f
        var realX = 0f
        val ori = ctx.resources.configuration.orientation
        if (ori == Configuration.ORIENTATION_LANDSCAPE) {
            realX = (point!!.y - y) / point!!.y
            realY = x / point!!.x
        } else if (ori == Configuration.ORIENTATION_PORTRAIT) {
            realX = (x / point!!.x)
            realY = (y / point!!.y)
        }
        rp.realX = realX
        rp.realY = realY

        Log.d("TouchSurfaceView", "点击了 $realX   x   $realY")
        return rp
    }


    fun sendFirstDownEvent(x: Float, y: Float) {
        val rp = getRealPointer(x, y)

        sendGestureStart();

        val eventData = JSONObject()
        eventData.put("seq", nextSeq())
        eventData.put("contact", 0)
        eventData.put("x", rp.realX)
        eventData.put("y", rp.realY)
        eventData.put("pressure", 1)
        ioSocket!!.emit("input.touchDown", channel, eventData)
        sendCommit()
    }

    private fun sendGestureStart() {
        val eventStart = JSONObject()
        eventStart.put("seq", nextSeq());
        ioSocket!!.emit("input.gestureStart", channel, eventStart)
    }

    private fun sendCommit() {
        val eventDataCommit = JSONObject()
        eventDataCommit.put("seq", nextSeq())
        ioSocket!!.emit("input.touchCommit", channel, eventDataCommit)
    }

    fun sendSecondDownEvent(x: Float, y: Float) {
        val rp = getRealPointer(x, y)
        val eventData = JSONObject()
        eventData.put("seq", nextSeq())
        eventData.put("contact", 1)
        eventData.put("x", rp.realX)
        eventData.put("y", rp.realY)
        eventData.put("pressure", 1)
        ioSocket!!.emit("input.touchDown", channel, eventData)
        sendCommit()

    }

    fun sendFirstMoveEvent(x: Float, y: Float) {
        val rp = getRealPointer(x, y)
        val eventFirstMoveData = JSONObject()
        eventFirstMoveData.put("seq", nextSeq())
        eventFirstMoveData.put("contact", 0)
        eventFirstMoveData.put("x", rp.realX)
        eventFirstMoveData.put("y", rp.realY)
        eventFirstMoveData.put("pressure", 1)
        ioSocket!!.emit("input.touchMove", channel, eventFirstMoveData)
        sendCommit()
    }

    fun sendSecondMoveEvent(x: Float, y: Float) {
        val rp = getRealPointer(x, y)
        val eventData = JSONObject()
        eventData.put("seq", nextSeq())
        eventData.put("contact", 1)
        eventData.put("x", rp.realX)
        eventData.put("y", rp.realY)
        eventData.put("pressure", 1)
        ioSocket!!.emit("input.touchMove", channel, eventData)
        sendCommit()
    }


    fun sendDisplayRotate(angle: Int) {
        val eventData = JSONObject()
        eventData.put("rotation", angle)
        eventData.put("lock", null)
        Log.d(TAG, "angle------$angle")
        ioSocket!!.emit("display.rotate", channel, eventData)
        sendRotateChange(angle)
    }

    private fun sendRotateChange(angle: Int) {
        ioSocket!!.emit("rotationChange", channel, angle)
    }

    fun sendLongDownEvent() {

    }

    fun sendFirstUpEvent() {
        val eventUp = JSONObject()
        eventUp.put("seq", nextSeq())
        eventUp.put("contact", 0)
        ioSocket!!.emit("input.touchUp", channel, eventUp)
        sendCommit()
    }

    fun sendGestureStop() {
        val eventStop = JSONObject()
        eventStop.put("seq", nextSeq())
        ioSocket!!.emit("input.gestureStop", channel, eventStop)
    }

    fun sendSecondUpEvent() {
        val eventUp = JSONObject()
        eventUp.put("seq", nextSeq())
        eventUp.put("contact", 1)
        ioSocket!!.emit("input.touchUp", channel, eventUp)
        sendCommit()
    }

    fun init(touchUrl: String) {
        if (touchUrl.isEmpty()) return
        try {
            ioSocket = IO.socket(touchUrl)

            ioSocket!!.on(Socket.EVENT_CONNECT, Emitter.Listener {
                Log.d(TAG, "on connect")
                ioSocket!!.emit("foo", "hi")
            }).on("event", Emitter.Listener { Log.d(TAG, "on event") })
                    .on(Socket.EVENT_ERROR, { args ->
                        Log.e(TAG, "EVENT_ERROR     #################" + args[0].toString())
                    })
                    .on(Socket.EVENT_DISCONNECT, {
                        Log.d(TAG, "event disconnect")
                    })

            ioSocket!!.on("device.change", {
                Log.d(TAG, "device oritation change ${it.toString()}")
            })
            ioSocket!!.connect()
        } catch (e: Exception) {
            Log.e(TAG, "touch url null")
        }
    }

    private fun nextSeq(): Int {
        if (++seq >= cycle) {
            seq = 0
        }
        return seq

    }

    companion object {
        private val TAG = "TouchUtil"
    }

}
