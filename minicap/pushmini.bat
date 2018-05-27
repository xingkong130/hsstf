set b=%cd%

cd adbtool


adb shell rm -r /data/local/tmp/busybox
adb shell rm -r /data/local/tmp/minicap
adb shell rm -r /data/local/tmp/minicap.so
adb shell rm -r /data/local/tmp/minitouch

adb push %b%\mini\busybox /data/local/tmp/busybox
adb push %b%\mini\minicap /data/local/tmp/minicap
adb push %b%\mini\minicap.so /data/local/tmp/minicap.so
adb push %b%\mini\minitouch /data/local/tmp/minitouch