/**
 * Created by yasir on 12/07/16.
 */

ppoutreach.controller('introController', ['$scope', '$location', function($scope, $location) {
    $scope.welcome = 'welcome to the introduction';
    $scope.go = function(path) {
        $location.path(path);
    };
}]);