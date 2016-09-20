ppoutreach.controller('reportController', ['$scope', '$location', function($scope, $location) {

    //routing:
    $scope.go = function(path) {
        $location.path(path);
    };

    //submit paper
    $scope.submitPaper = function() {
        //insert logic
    };

    //for ng-repeat:
    $scope.reportSections = [
        {title: "Abstract"},
        {title: "Introduction"},
        {title: "Method"},
        {title: "Results"},
        {title: "Conclusions"}
    ]
}]);