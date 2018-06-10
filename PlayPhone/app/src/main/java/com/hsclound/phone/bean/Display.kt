package com.hsclound.phone.bean

import com.google.gson.annotations.SerializedName
import java.io.Serializable


/**
 * Auto-generated: 2018-05-29 22:20:12
 *
 * @author aTool.org (i@aTool.org)
 * @website http://www.atool.org/json2javabean.php
 */
class Display : Serializable {

    @SerializedName("audioUrl")
    var audiourl: String? = null
    var density: Double = 0.toDouble()
    var fps: Float = 0f
    var height: Int = 0
    var id: Int = 0
    var rotation: Int = 0
    @SerializedName("screenUrl")
    var screenurl: String? = null
    var secure: Boolean = false
    var size: Double = 0.toDouble()
    var width: Int = 0
    var xdpi: Double = 0.toDouble()
    var ydpi: Double = 0.toDouble()
    @SerializedName("touchUrl")
    var touchurl: String? = null

    override fun toString(): String {
        return "Display(audiourl=$audiourl, density=$density, fps=$fps, height=$height, id=$id, rotation=$rotation, screenurl=$screenurl, secure=$secure, size=$size, width=$width, xdpi=$xdpi, ydpi=$ydpi, touchurl=$touchurl)"
    }


}