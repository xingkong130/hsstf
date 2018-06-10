package com.hsclound.phone.bean

import java.io.Serializable

class UserData : Serializable {
    /*{"success":true,"userid":"c3ef36049bd844b19f85527e4870ca62",
     "jwt":"eyJhbGciOiJIUzI1NiIsImV4cCI6MTUyNzU5ODg5MzI4MX0.eyJpZCI6ImMzZWYzNjA0OWJkODQ0YjE5Zjg1NTI3ZTQ4NzBjYTYyIiwibmFtZSI6ImNweWFjcHkifQ.fm-ZtCo8EHv6DQIhA4--Ad9KGIsBDtBwuecCFzW7d30"
     ,"redirect":"http://192.168.0.103:7100/?jwt=eyJhbGciOiJIUzI1NiIsImV4cCI6MTUyNzU5ODg5MzI4MX0.eyJpZCI6ImMzZWYzNjA0OWJkODQ0YjE5Zjg1NTI3ZTQ4NzBjYTYyIiwibmFtZSI6ImNweWFjcHkifQ.fm-ZtCo8EHv6DQIhA4--Ad9KGIsBDtBwuecCFzW7d30"
     }
     */
    var success: Boolean = false
    var userid: String = ""
    var jwt: String = ""

    override fun toString(): String {
        return "success ${this.success} jwt ${this.jwt} userid ${this.userid}"
    }

}
