module.exports = function SignInCtrl($scope, $http) {

  $scope.error = null

  $scope.submit = function() {
    var data = {
      name: $scope.signin.username.$modelValue
      , pwd: $scope.signin.password.$modelValue
      , checkcode: $scope.signin.checkcode.$modelValue
    }
    $scope.invalid = false
    $http.post('/auth/api/v1/register', data)
      .success(function(response) {
        $scope.error = null
        location.replace(response.redirect)
      })
      .error(function(response) {
        switch (response.error) {
          case 'ValidationError':
            $scope.error = {
              $invalid: true
            }
            break
          case 'InvalidCredentialsError':
            $scope.error = {
              $incorrect: true
            }
            break
          default:
            $scope.error = {
              $server: true
            }
            break
        }
      })
  }
  
  $scope.login = function() {
    var data = {
      name: $scope.signin.username.$modelValue
      , pwd: $scope.signin.password.$modelValue
	, checkcode: $scope.signin.checkcode.$modelValue
    }
    $scope.invalid = false
    $http.post('/auth/api/v1/login', data)
      .success(function(response) {
        $scope.error = null
        location.replace(response.redirect)
      })
      .error(function(response) {
        switch (response.error) {
          case 'ValidationError':
            $scope.error = {
              $invalid: true
            }
            break
          case 'InvalidCredentialsError':
            $scope.error = {
              $incorrect: true
            }
            break
          default:
            $scope.error = {
              $server: true
            }
            break
        }
      })
  }
  
  $scope.getCheckCode = function() {
     $http.get('/auth/api/v1/checkcode')
      .success(function(response) {
        $scope.error = null
        $scope.checkcode = response.success ? response.checkcode : ''
      })
      .error(function(response) {
        console.log(response.error)
      })
  }
  
  $scope.getCheckCode()
 
}
