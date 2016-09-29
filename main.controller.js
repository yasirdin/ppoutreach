ppoutreach.controller("mainController", ['$scope', '$mdSidenav', '$location', '$rootScope', '$cookies', '$state', function($scope, $mdSidenav, $location, $rootScope, $cookies, $state) {

    //sidenav:
    $scope.openLeftMenu = function() {
        $mdSidenav('left').toggle();
    };

    //login screen layout fix:
    $scope.location = $location;

    /* closing:
    $scope.openLeftMenu = function() {
        $mdSidenav('left').close();
    };
    */
    
    //logout button redirects to home page
    $scope.logout = function() {
        $location.path('/');
    };
    
    //sidenav contents:
    $scope.menu = [
        {title: 'Subject selection'},
        {title: 'Introduction'},
        {title: 'Data'},
        {title: 'Analysis exercise'},
        {title: 'Report Writing'}
    ];
}]);