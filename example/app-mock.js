'use strict';

angular.module('app-test', ['app', 'ngMockE2E'])
	.run(['$rootScope', '$httpBackend', function ($rootScope, $httpBackend) {
		
		$httpBackend.whenGET(/^app\/views\/\w+\.html$/).passThrough();
		$httpBackend.whenGET(/^\w+\.html$/).passThrough();
	
		var emptyRespond = function(method, url, data) {return [200, {}, {}];};
		var alertRespond = function(method, url, data) {
			alert(data);
			return [200, {}, {}];
		};
		
		$rootScope.data = {};
		var rest = function(urlPrefix, model, valueKey, uploadable) {
			var modelObj = angular.isString(model) ? angular.fromJson(model) : model;
			
			var findUrl = urlPrefix + '/list.do';
			var entries = [];
			for (var i = 0; i < 12; i = i + 1) {
				var entry = angular.extend({}, modelObj);
				entry.id = i + 1;
				entries.push(entry);
			}
			$rootScope.data[findUrl] = entries;
			
			$httpBackend.whenPOST(findUrl).respond(function(method, url, data) {
				var list = $rootScope.data[findUrl];
				return [200, {code: 0, result: list, total: list.length}, {}];
			});
			
			$httpBackend.whenPOST(urlPrefix + '/add.do').respond(function(method, url, data, headers) {
				alert(data);
				var newEntry = angular.extend({id: new Date().getTime()}, angular.fromJson(data));
				$rootScope.data[findUrl].push(newEntry);
				return [200, {code: 0, result: newEntry}, {}];
			});
			
			$httpBackend.whenPOST(urlPrefix + '/delete.do').respond(alertRespond);
			
			if (angular.isDefined(valueKey) && valueKey != null) {
				
				$httpBackend.whenGET(urlPrefix + '/getKeyValues.do').respond(function(method, url, data) {
					var result = [];
					angular.forEach($rootScope.data[findUrl], function(item) {
						result.push({key: item.id, value: item[valueKey]});
					});
					return [200, {code: 0, result: result}, {}];
				});
			}
			
			if (uploadable === true) {
				$httpBackend.whenPOST(urlPrefix + '/upload.do').respond(alertRespond);
			}
		};
		
		$httpBackend.whenPUT(function(url) {return true;}).respond(function(method, url, data, headers) {
			alert(data);
			return [200, {code: 0, result: angular.fromJson(data)}, {}];
		});
		
		var post = function(url) {
			$httpBackend.whenPOST(url).respond(alertRespond);
		};
		var get = function(url, result) {
			$rootScope.data[url] = {code: 0, result: angular.isString(result) ? angular.fromJson(result) : result};
			$httpBackend.whenGET(url).respond(function(method, url, data) {
				return [200, $rootScope.data[url], {}];
			});
		};
		
		rest('api/admin/publisher', '{"id":2,"name":"Wiley","place":"Hoboken, NJ"}');
		
    }]);