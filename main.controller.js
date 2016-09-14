ppoutreach.controller("mainController", ['$scope', '$mdSidenav', '$location', '$rootScope', function($scope, $mdSidenav, $location, $rootScope) {
    $scope.openLeftMenu = function() {
        $mdSidenav('left').toggle();
    };

    /* closing:
    $scope.openLeftMenu = function() {
        $mdSidenav('left').close();
    };
    */

    $scope.logout = function() {
        $location.path('/');
    };

    $scope.menu = [
        {title: 'Subject selection'},
        {title: 'Introduction'},
        {title: 'Data'},
        {title: 'Analysis exercise'}
    ];
}]);