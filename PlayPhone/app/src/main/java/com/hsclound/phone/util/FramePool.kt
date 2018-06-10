package com.hsclound.phone.util


import com.hsclound.phone.bean.Frame

import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingDeque

/**
 * Created by budog on 18/5/22.
 */

class FramePool {

    val pool: BlockingQueue<Frame> = LinkedBlockingDeque()


    fun put(frame: Frame) {
        try {
            pool.put(frame)
        } catch (e: InterruptedException) {
            e.printStackTrace()
        }

    }
}
