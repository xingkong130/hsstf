package com.hsclound.phone.util;

import android.util.Log;

import com.hsclound.phone.bean.Frame;

import java.util.Arrays;
import java.util.Objects;

/**
 * Created by budog on 18/5/22.
 */

public class PlayAacAudioThread extends Thread {
    private FramePool pool = null;
    private AACDecoderUtil audioUtil;
    private boolean status = false;
    //这个值用于找到第一个帧头后，继续寻找第二个帧头，如果解码失败可以尝试缩小这个值
    private int FRAME_MIN_LEN = 50;
    //一般AAC帧大小不超过200k,如果解码失败可以尝试增大这个值
    private static int FRAME_MAX_LEN = 100 * 1024;
    //根据帧率获取的解码每帧需要休眠的时间,根据实际帧率进行操作
    private int PRE_FRAME_TIME = 1000 / 50;

    private int count = 0;


    byte[] frame = new byte[FRAME_MAX_LEN];
    int frameLen = 0;

    public PlayAacAudioThread(FramePool pool) {
        this.pool = pool;
    }

    @Override
    public void run() {
        super.run();
        try {
            this.audioUtil = new AACDecoderUtil();
            this.audioUtil.start();
            Frame frame = pool.getPool().take();
            status = true;
            while (frame != null) {
                playDecoder(Objects.requireNonNull(frame.getData()));
                frame = pool.getPool().take();
            }
//            Log.d("TAG", "-------frame null----------");
            audioUtil.stop();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }


    private void playDecoder(byte[] newData) {
        long startTime = System.currentTimeMillis();
        if (frameLen + newData.length < FRAME_MAX_LEN) {
            //把过来的数据copy到frame里面
            System.arraycopy(newData, 0, frame, frameLen, newData.length);
            frameLen += newData.length;
            int firstHeadIndex = findHead(frame, 0, frameLen);
            while (firstHeadIndex >= 0 && isHead(frame, firstHeadIndex)) {
                //继续找第二个
                int secondHeadIndex = findHead(frame, firstHeadIndex + FRAME_MIN_LEN, frameLen);
                if (secondHeadIndex > 0 && isHead(frame, secondHeadIndex)) {
                    count++;
//                    Log.e("ReadAACFileThread", "Length : " + (secondHeadIndex - firstHeadIndex));

                    audioUtil.decode(frame, firstHeadIndex, secondHeadIndex - firstHeadIndex);

//                    Log.d("TAG", "put count " + count + " to pool!");

                    if (secondHeadIndex > frameLen) {
//                        Log.d("TAG", ">>>>>>>");
                    }
                    //截取headSecondIndex之后到frame的有效数据,并放到frame最前面
                    byte[] temp = Arrays.copyOfRange(frame, secondHeadIndex, frameLen);

                    System.arraycopy(temp, 0, frame, 0, temp.length);
                    //修改frameLen的值
                    frameLen = temp.length;
                    //线程休眠
//                    sleepThread(startTime, System.currentTimeMillis());
//                    重置开始时间
                    startTime = System.currentTimeMillis();
                    //继续寻找数据帧
                    firstHeadIndex = findHead(frame, 0, frameLen);
                } else {
                    //找不到第二个帧头
                    firstHeadIndex = -1;
                }
            }
//            Log.d("play audio", "end..............");
        }
    }

    //修眠
    private void sleepThread(long startTime, long endTime) {
        //根据读文件和解码耗时，计算需要休眠的时间
        long time = PRE_FRAME_TIME - (endTime - startTime);
        if (time > 0) {
            try {
                Thread.sleep(time);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }


    /**
     * 寻找指定buffer中AAC帧头的开始位置
     *
     * @param startIndex 开始的位置
     * @param data       数据
     * @param max        需要检测的最大值
     * @return
     */
    private int findHead(byte[] data, int startIndex, int max) {
        int i;
        for (i = startIndex; i <= max; i++) {
            //发现帧头
            if (isHead(data, i))
                break;
        }
        //检测到最大值，未发现帧头
        if (i >= max) {
            i = -1;
        }
        return i;
    }

    /**
     * 判断aac帧头
     */
    private boolean isHead(byte[] data, int offset) {
        boolean result = false;
        if (data[offset] == (byte) 0xFF && data[offset + 1] == (byte) 0xF9 && data[offset + 3] == (byte) 0x80) {
            result = true;
        }
        return result;
    }

    public void stopP() {
        status = true;
        audioUtil.stop();
    }

    public boolean getStatus() {
        return status;
    }
}
