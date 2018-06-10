package com.hsclound.phone.util

import android.graphics.BitmapFactory
import android.graphics.Point
import android.graphics.Rect
import android.view.SurfaceHolder
import java.io.ByteArrayInputStream

/**
 * Created by budog on 18/5/22.
 */

class DrawImgThread(private val pool: DataPool, private val holder: SurfaceHolder) : Thread() {
    var point: Point? = null
    override fun run() {
        super.run()
        var count: Int = 0;
        while (true) {
            try {
                val frame = pool.pool.take()
//                if (++count % 2 == 0) {
                    val bitmap = BitmapFactory.decodeStream(ByteArrayInputStream(frame.data))
//                    val scoal = Matrix()
//                    scoal.preScale(5.0f, 5.0f)
//                    val rbitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, scoal, false)
                    val canvas = holder.lockCanvas()
                    if (canvas != null && bitmap != null) {
                        canvas.drawBitmap(bitmap, null, Rect(0, 0, canvas.width, canvas.height), null)
                        holder.unlockCanvasAndPost(canvas)
                    }
//                }

            } catch (e: InterruptedException) {
                e.printStackTrace()
            }

        }
    }


}
