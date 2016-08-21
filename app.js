var ppoutreach = angular.module('ppoutreach', ['ui.bootstrap', 'ui.router']);

//allows access to $state object on html, relevant for hiding header during login:
ppoutreach.run(function($state, $rootScope){
    $rootScope.$state = $state;
});

ppoutreach.config(['$urlRouterProvider', '$stateProvider' , function($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('login', {
            url: '/',
            templateUrl: 'login.html',
            controller: 'loginController'
        })
        .state('intro', {
            url: '/intro',
            templateUrl: 'intro.html',
            controller: 'introController'
        })
        .state('dashboard', {
            url: '/dashboard',
            templateUrl: 'dashboard.html',
            controller: 'dashboardController'
        })
        .state('analysis', {
            url: '/analysis',
            templateUrl: 'analysis.html',
            controller: 'analysisController'
        }
    )
}]);
