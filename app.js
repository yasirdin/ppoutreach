var ppoutreach = angular.module('ppoutreach', ['ui.bootstrap']);

ppoutreach.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl : 'login.html',
            controller : 'loginController'
        })
        .when('/intro', {
            resolve: {
                'check': function ($location, $rootScope) {
                    if (!$rootScope.loggedIn) {
                        $location.path('/');
                    }
                }
            },
            templateUrl: 'intro.html',
            controller: 'introController'
        })
        .when('/dashboard', {
            templateUrl: 'dashboard.html',
            controller: 'dashboardController'
        })
        
        .when('/analysis', {
            templateUrl: 'analysis.html',
            controller: 'analysisController'
        })
            
        .otherwise({
            redirectTo: '/'
        })
    
}]);


