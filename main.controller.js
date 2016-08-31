ppoutreach.controller("mainController", ['$scope', '$mdSidenav', '$location', function($scope, $mdSidenav, $location) {
    $scope.openLeftMenu = function() {
        $mdSidenav('left').toggle();
    };

    $scope.logout = function() {
        $location.path('/');
    }
}]);