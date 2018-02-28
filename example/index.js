'use strict';

angular.module('app', [
    'ui.bootstrap', 'ui.router',
    'ui.bootstrap.datetimepicker',
    'ui.select',
    'LocalStorageModule', 'ngCookies',
    'ngSanitize',
    'ngFileUpload',
    'ngAnimate',
    'angular-loading-bar',
    'angular-common'
]).config(['$httpProvider', '$urlRouterProvider', '$stateProvider', function ($httpProvider, $urlRouterProvider, $stateProvider) {
    	$httpProvider.interceptors.push(function($q, toastr) {
        	return {
        		'response': function(response) {
        			if (angular.isDefined(response.data.code) && response.data.code != 0) {
        				toastr.error(response.data.result);
                		return $q.reject(response);
                	}
        			return response;
        		 },
        		'responseError': function(response) {
        			if (response.status == 403) {
        				toastr.error('访问受限，请登录后操作');
                		return $q.reject(response);
        			}
        			toastr.error(response.statusText);
                	return $q.reject(response);
        		}
        	}
        });
    	
    	$urlRouterProvider.otherwise('/');
    	
    	var tableTemplate = '<div class="row"><div class="col-md-10"><dp-table config="tableConfig"/></div></div>';
    	var version = '?v=1';
        $stateProvider
	        .state('app', {abstract: true, templateUrl: 'layout.html', controller: 'layoutCtrl'})
			.state('app.home', {url: '/', template: tableTemplate, controller: 'homeCtrl'})
			;
    }])
    .controller('layoutCtrl', ['$scope', function($scope) {
	}])
	.controller('homeCtrl', ['$scope', function($scope) {
		$scope.tableConfig = {
			entity: {id: 'publisher', name: '出版社'},
			search: {
    			keyword: {}, field: {items: [{}], defaultValue: '', dataUrl: ''}, 
    			option: {items: [{}], defaultValue: '', dataUrl: '', placeholder: ''},
    			startDate: {placeholder: ''}, endDate: {placeholder: ''},
    			payload: function(params) {
    				
    			}
    		},
    		action: {
    			refresh: true, create: true, update: true, remove: true, 
    			buttons: [], 
    			dropdowns: []
    		},
    		columns: [],
    		childTable: {
    			
    		},
    		
			searchable: true, searchFields: [{name: '按名称', value: 'name', defaultField: true}, {name: '按地点', value: 'place'}],
    		refreshable: true, deleteable: true, createable: true, editable: true, entityName: '出版社',
    		searchParams: function(params) {
    			return params.keyword ? {method: params.field == 'place' ? 'findByPlaceContaining' : 'findByNameContaining', keyword: params.keyword} : null;
    		},
    		restUrl: 'api/admin/publisher',
    		columns: [
    		    {name: 'name', title:'名称', type: 'text', maxlength: 40, required: true},
    		    {name: 'place', title:'地点', type: 'text', maxlength: 32}
    		]
    	};
	}])
    .run(['$rootScope', '$window', '$http', '$state', function ($rootScope, $window, $http, $state) {
        $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams) {
            $rootScope.toState = toState;
            $rootScope.toStateParams = toStateParams;
        });

        $rootScope.$on('$stateChangeSuccess',  function(event, toState, toParams, fromState, fromParams) {
            if (toState.name != 'app.login' && $rootScope.previousStateName) {
            	$rootScope.previousStateName = fromState.name;
            	$rootScope.previousStateParams = fromParams;
            }
        });
        
        $rootScope.back = function() {
            if ($rootScope.previousStateName === 'activate' || $state.get($rootScope.previousStateName) === null) {
                $state.go('app.home');
            } else {
                $state.go($rootScope.previousStateName, $rootScope.previousStateParams);
            }
        };
    }])
    ;
