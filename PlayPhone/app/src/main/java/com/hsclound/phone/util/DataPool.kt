package com.hsclound.phone.util

import com.hsclound.phone.bean.Frame

import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingDeque

/**
 * Created by budog on 18/5/22.
 */

class DataPool {
    val pool: BlockingQueue<Frame> = LinkedBlockingDeque()

    val poolCount: Int
        get() = pool.size
}
