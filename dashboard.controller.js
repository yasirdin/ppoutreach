/**
 * Created by yasir on 14/07/16.
 */

ppoutreach.controller('dashboardController', ['$scope', '$modal', '$location', function($scope, $modal, $location) {
    $scope.welcome = 'Welcome to the data dashboard!';
    $scope.go = function(path) {
        $location.path(path);
    };
    $scope.moreInfo = function(dataType) {
        if (dataType == "bg1") {
            $modal.open({
                template: "More information on background 1"
            });
        }
        else if (dataType == "bg2") {
            $modal.open({
                template: "More information on background 2"
            });
        }
        else if (dataType == "sig"){
            $modal.open({
                template: "More information on signal"
            });
        }
    }
}]);