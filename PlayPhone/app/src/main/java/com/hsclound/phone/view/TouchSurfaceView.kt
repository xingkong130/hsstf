package com.hsclound.phone.view

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.PointF
import android.util.AttributeSet
import android.util.Log
import android.view.MotionEvent
import android.view.SurfaceView

/**
 * Created by budog on 18/5/14.
 */
class TouchSurfaceView : SurfaceView {

    private var listener: EventListener? = null

    // 用于判断第2个手指是否存在
    private var haveSecondPoint = false

    private var fingerCount = 0;

    // 记录第2个手指第位置
    internal var point = PointF(0f, 0f)


    constructor(context: Context) : super(context) {}

    constructor(context: Context, attrs: AttributeSet) : super(context, attrs) {}

    constructor(context: Context, attrs: AttributeSet, defStyleAttr: Int) : super(context, attrs, defStyleAttr) {}

    fun setListener(listener: EventListener) {
        this.listener = listener
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        val index = event.actionIndex
        when (event.actionMasked) {

            MotionEvent.ACTION_DOWN -> {
                Log.d(TAG, "第1个手指按下")
                fingerCount++;
                listener!!.firstDown(event.x, event.y)
            }

            MotionEvent.ACTION_UP -> {
                // 判断抬起的手指是否是第1个
                val tempIndex = event.getPointerId(index)
                if (tempIndex == 0) {
                    haveSecondPoint = false
                    fingerCount--;
                    Log.d(TAG, "第1个手指抬起11111");
                    listener!!.firstUp()
                } else if (tempIndex == 1) {
                    haveSecondPoint = false
                    fingerCount--;
                    Log.d(TAG, "第2个手指抬起11111");
                    listener!!.secondUp()
                }
                if (fingerCount == 0) {
                    Log.d(TAG, "没有手指")
                    listener!!.touchEnd()
                }
            }

            MotionEvent.ACTION_POINTER_DOWN ->
                // 判断是否是第2个手指按下
                if (event.getPointerId(index) == 1) {
                    Log.d(TAG, "第2个手指按下")
                    fingerCount++
                    listener!!.secondDown(event.getX(1), event.getY(1))
                    haveSecondPoint = true
                }

            MotionEvent.ACTION_POINTER_UP -> {
                // 判断抬起的手指是否是第2个
                if (event.getPointerId(index) == 1) {
                    Log.d(TAG, "第2个手指抬起2222");
                    fingerCount--;
                    haveSecondPoint = false
                    listener!!.secondUp()
                } else if (event.getPointerId(index) == 0) {
                    Log.d(TAG, "第1个手指抬起2222");
                    fingerCount--;
                    haveSecondPoint = false
                    listener!!.firstUp()
                }
                if (fingerCount == 0) {
                    listener!!.touchEnd()
                }
            }


            MotionEvent.ACTION_MOVE -> {

                if (haveSecondPoint) {
                    val firstPointIndex = event.findPointerIndex(0)
                    val secondPointIndex = event.findPointerIndex(1)
                    Log.d(TAG, "同时移动 $firstPointIndex   $secondPointIndex")
                    listener!!.firstMove(event.getX(firstPointIndex), event.getY(firstPointIndex))
                    listener!!.secondMove(event.getX(secondPointIndex), event.getY(secondPointIndex))
                } else {
                    val i = event.getPointerId(index)
                    val x = event.getX(event.findPointerIndex(i))
                    val y = event.getY(event.findPointerIndex(i))
                    if (i == 0) {
                        Log.d(TAG, "第1个手指移动")
                        listener!!.firstMove(x, y)
                    } else if (i == 1) {
                        Log.d(TAG, "第2个手指移动")
                        listener!!.secondMove(x, y)
                    }
                }
            }
        }
        return true
    }

    interface EventListener {

        fun firstDown(x: Float, y: Float)

        fun secondDown(x: Float, y: Float)

        fun firstMove(x: Float, y: Float)

        fun secondMove(x: Float, y: Float)

        fun firstUp()

        fun secondUp()


        fun touchEnd()
    }

    companion object {
        val TAG: String = TouchSurfaceView::class.java.simpleName
    }
}
