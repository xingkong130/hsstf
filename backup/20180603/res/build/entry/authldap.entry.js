webpackJsonp([2,6],[
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__.e/* nsure */(3, function(require) {
	  __webpack_require__(13)

	  __webpack_require__(1)
	  __webpack_require__(2)
	  __webpack_require__(3)

	  angular.module('app', [
	    'ngRoute',
	    'ngTouch',
	    __webpack_require__(4).name,
	    __webpack_require__(636).name
	  ])
	    .config(function($routeProvider, $locationProvider) {
	      $locationProvider.html5Mode(true)
	      $routeProvider
	        .otherwise({
	          redirectTo: '/auth/ldap/'
	        })
	    })

	})


/***/ })
]);