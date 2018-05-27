set b=%cd%

c:
cd C:\Users\xiao
adb shell rm -r /data/local/tmp/minicap
adb push %b%\obj\local\armeabi-v7a\minicap /data/local/tmp/minicap
adb shell chmod 777 /data/local/tmp/minicap

::adb shell rm -r /data/local/tmp/minicap.so
::adb push D:\work\hs\stf\minicap\jni\minicap-shared\aosp\libs\android-22\armeabi-v7a\minicap.so /data/local/tmp/minicap.so
::adb shell chmod 777 /data/local/tmp/minicap.so



adb push D:\wdata\tool\busybox /data/local/tmp
adb shell chmod 777 /data/local/tmp/busybox


