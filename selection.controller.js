ppoutreach.controller('selectionController', ['$scope', '$rootScope', function($scope, $rootScope) {

    //TODO: grey out the buttons for astrophysics and string theory
    $scope.subjects = [
        {name: 'Particle physics', link: "/ppoutreach/#/intro"},
        {name: 'Astrophysics', link: "/ppoutreach/#/"},
        {name:'String theory', link: "/ppoutreach/#/"}
    ];

    $scope.currentSelection = function(selection) {
        $rootScope.subject = selection;
    }

}]);