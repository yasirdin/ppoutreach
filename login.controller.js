ppoutreach.controller('loginController', ['$scope', '$location', '$rootScope', function($scope, $location, $rootScope) {
    $scope.submit = function() {
        var uname = $scope.username;
        if (uname == 'admin'){
            $rootScope.loggedIn = true;
            $location.path('/intro');
        }
        else {
            alert('Username not unrecognised, please type admin')
        }
    };
}]);



