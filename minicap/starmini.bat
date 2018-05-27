set b=%cd%
cd adbtool




adb shell /data/local/tmp/busybox killall minicap minitouch
adb shell /data/local/tmp/busybox killall minicap minitouch

start adb shell LD_LIBRARY_PATH=/data/local/tmp /data/local/tmp/minicap -P 512x768@300x768/90
start adb shell /data/local/tmp/minitouch

adb forward tcp:1717 localabstract:minicap
adb forward tcp:1111 localabstract:minitouch
adb forward tcp:1199 tcp:1199

