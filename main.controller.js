ppoutreach.controller("mainController", ['$scope', '$mdSidenav', '$location', '$rootScope', function($scope, $mdSidenav, $location, $rootScope) {
    $scope.openLeftMenu = function() {
        $mdSidenav('left').toggle();
    };

    $scope.logout = function() {
        $location.path('/');
    }
}]);