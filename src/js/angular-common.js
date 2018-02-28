/**
 * Common useful service base on AngularJS
 * @version 1.0.0
 * @license MIT
 */
(function(angular) {

var toFormString = function(data) {
	var params = '';
	angular.forEach(data, function(val, key) {
		if (val != null) {
			params += (key + '=' + val + '&');
		} else {
			params += key + '=&';
		}
	});
	return params;
};
	
angular.module('angular-common', [
        'ui.bootstrap.modal', 'ui.bootstrap.pager', 'ui.bootstrap.pagination', 'ui.bootstrap.datetimepicker',
        'LocalStorageModule'
	]).run(["$templateCache", function($templateCache) {
		$templateCache.put('directives/progressbar/progressbar.html', '<div class="toast-progress"></div>\n');
		$templateCache.put('directives/toast/toast.html', 
				'<div class="toast {{toastType}}" ng-click="close()">\n' + 
					'<div>\n' + 
						'<div ng-if="title" class="toast-title" aria-label="{{title}}">{{title}}</div>\n' +
						'<div class="toast-message" aria-label="{{message}}">{{message}}</div>\n' +
					'</div>\n' +
					'<progress-bar ng-if="progressBar"></progress-bar>\n' +
				'</div>\n');
	}])
/**========================================================== Toast ==========================================================*/
    .constant('toastConfig', {extendedTimeOut: 1000, progressBar: false, timeOut: 2000})
	.factory('toastr', ['$rootScope', '$injector', '$q', 'toastConfig', function($rootScope, $injector, $q, toastConfig) {
		var $animate
		var container = null;
	    var containerDefer = $q.defer();
	    function getContainer() {
	    	if (!$animate) {
	    		$animate = $injector.get('$animate');
	    	}
	    	if (container == null) {
	    		container = angular.element('<div id="toast-container" class="toast-top-right" style="pointer-events:auto;"></div>');
		        var target = angular.element(document.querySelector('body'));
		        if (!target || !target.length) {
		        	throw 'Target for toasts doesn\'t exist';
		        }
		        $animate.enter(container, target).then(function() {
		        	containerDefer.resolve();
		        });
	    	}
	        return containerDefer.promise;
	    };
	    
	    var toasts = [];
	    var index = 0;
	    var openToasts = {};
		function buildNotification(type, message, title, optionsOverride) {
			openToasts[message] = true;
			if (angular.isObject(title)) {
		    	optionsOverride = title;
		        title = null;
		    }
			// 合并选项
	        var options = angular.extend({}, toastConfig);
	        if (optionsOverride) {
	        	angular.extend(options, optionsOverride);
	        }
	        
	        var newToast = {toastId: index++, isOpened: false, scope: $rootScope.$new()};
	        newToast.scope.title = title;
	        newToast.scope.message = message;
	        newToast.scope.toastType = type;
	        newToast.scope.toastId = newToast.toastId;
	        newToast.scope.options = {
	        	extendedTimeOut: options.extendedTimeOut,
	        	progressBar: options.progressBar,
	        	timeOut: options.timeOut
	        };
	        newToast.el = $injector.get('$compile')(angular.element('<div toast></div>'))(newToast.scope);
	        toasts.push(newToast);
	        getContainer().then(function() {
	        	if (!$animate) {
		    		$animate = $injector.get('$animate');
		    	}
        		newToast.isOpened = true;
        		$animate.enter(newToast.el, container).then(function() {
    				newToast.scope.init();
    			});
        	});
	        return newToast;
		};
		
		return {
			success: function(message, title, optionsOverride) { return buildNotification('toast-success', message, title, optionsOverride);},
			info: function(message, title, optionsOverride) { return buildNotification('toast-info', message, title, optionsOverride);},
			warning: function(message, title, optionsOverride) { return buildNotification('toast-warning', message, title, optionsOverride);},
			error: function(message, title, optionsOverride) { return buildNotification('toast-error', message, title, optionsOverride);},
			remove: function(toastId) {
		    	var toast = null;
		    	for (var i = 0; i < toasts.length; i++) {
	        		if (toasts[i].toastId === toastId) {
	        			toast = toasts[i];
	        			break;
	        		}
	        	}
		        if (toast && !toast.deleting) { // Avoid clicking when fading out
		        	toast.deleting = true;
		        	toast.isOpened = false;
		        	if (!$animate) {
			    		$animate = $injector.get('$animate');
			    	}
		        	$animate.leave(toast.el).then(function() {
		        		toast.scope.$destroy();
		        		var index = toasts.indexOf(toast);
		        		delete openToasts[toast.scope.message];
		        		toasts.splice(index, 1);
		        		if (!toasts.length) {
		        			container.remove();
		        			container = null;
		        			containerDefer = $q.defer();
		        		}
		        	});
		        }
		    }
		}
	}])
	.controller('ToastController', function() {
		this.progressBar = null;
	    this.startProgressBar = function(duration) {
    		if (this.progressBar) {
    			this.progressBar.start(duration);
    		}
    	};
    	this.stopProgressBar = function() {
    		if (this.progressBar) {
    			this.progressBar.stop();
    		}
    	};
    })
	.directive('toast', function($injector, $interval, toastConfig, toastr) {
        return {
        	replace: true,
        	templateUrl: 'directives/toast/toast.html',
        	controller: 'ToastController',
        	link: function(scope, element, attrs, toastCtrl) {
            	var timeout;
                scope.progressBar = scope.options.progressBar;
                scope.init = function() {
                	if (scope.options.timeOut) {
                		timeout = createTimeout(scope.options.timeOut);
                	}
                };
                scope.close = function ($event) {
                	if ($event && angular.isFunction($event.stopPropagation)) {
                		$event.stopPropagation();
                	}
                	toastr.remove(scope.toastId);
                };
                element.on('mouseenter', function() {
                	hideAndStopProgressBar();
                	if (timeout) {
                		$interval.cancel(timeout);
                	}
                });
                element.on('mouseleave', function() {
                	if (scope.options.timeOut === 0 && scope.options.extendedTimeOut === 0) { 
                		return; 
                	}
                	scope.$apply(function() {
                		scope.progressBar = scope.options.progressBar;
                	});
                	timeout = createTimeout(scope.options.extendedTimeOut);
                });
                function createTimeout(time) {
                	toastCtrl.startProgressBar(time);
                	return $interval(function() {
                		toastCtrl.stopProgressBar();
                		toastr.remove(scope.toastId);
                	}, time, 1);
                }
                function hideAndStopProgressBar() {
                	scope.progressBar = false;
                	toastCtrl.stopProgressBar();
                }
            }
        };
    })
	.directive('progressBar', function(toastConfig) {
		return {
			replace: true,
			require: '^toast',
			templateUrl: 'directives/progressbar/progressbar.html',
			link: function(scope, element, attrs, toastCtrl) {
				var intervalId, currentTimeOut, hideTime;
				toastCtrl.progressBar = scope;
				scope.start = function(duration) {
					if (intervalId) {
						clearInterval(intervalId);
					}
					currentTimeOut = parseFloat(duration);
					hideTime = new Date().getTime() + currentTimeOut;
					intervalId = setInterval(updateProgress, 10);
				};
				scope.stop = function() {
					if (intervalId) {
						clearInterval(intervalId);
					}
				};
				function updateProgress() {
					var percentage = ((hideTime - (new Date().getTime())) / currentTimeOut) * 100;
					element.css('width', percentage + '%');
				}
				scope.$on('$destroy', function() {
					// Failsafe stop
					clearInterval(intervalId);
				});
			}
		};
	})
/**========================================================== Confirm Dialog ==========================================================*/
	.controller('ConfirmModalController', function ($scope, $uibModalInstance, data) {
		$scope.data = angular.copy(data);
		$scope.ok = function (closeMessage) {
			$uibModalInstance.close(closeMessage);
		};
		
		$scope.cancel = function (dismissMessage) {
			$uibModalInstance.dismiss(angular.isDefined(dismissMessage) ? dismissMessage : 'cancel');
			if (angular.isDefined(data.postCancel)) {
				data.postCancel();
			}
		};
	})
	.value('$confirmModalDefaults', {
		template: '<div class="modal-header"><h3 class="modal-title">{{data.title}}</h3></div>' +
		'<div class="modal-body">{{data.text}}</div>' +
		'<div class="modal-footer">' +
		'<button class="btn btn-primary" ng-click="ok()">{{data.ok}}</button>' +
		'<button class="btn btn-default" ng-click="cancel()">{{data.cancel}}</button>' +
		'</div>',
		controller: 'ConfirmModalController',
		defaultLabels: {
			title: '确认框',
			ok: '确定',
			cancel: '取消'
		}
	})
	.factory('$confirm', function ($uibModal, $confirmModalDefaults) {
		return function (data, settings) {
			var defaults = angular.copy($confirmModalDefaults);
			settings = angular.extend(defaults, (settings || {}));
			data = angular.extend({}, settings.defaultLabels, data || {});
			if ('templateUrl' in settings && 'template' in settings) {
				delete settings.template;
			}
			settings.resolve = {
				data: function () {
					return data;
				}
			};
			return $uibModal.open(settings).result;
		};
	})
	.directive('confirm', function ($confirm) {
		return {
			priority: 1,
			restrict: 'A',
			scope: {
				confirmIf: "=",
				ngClick: '&',
				confirm: '@',
				confirmSettings: "=",
				confirmTitle: '@',
				confirmOk: '@',
				confirmCancel: '@'
			},
			link: function (scope, element, attrs) {
				element.unbind("click").bind("click", function ($event) {
					$event.preventDefault();
					if (angular.isUndefined(scope.confirmIf) || scope.confirmIf) {
						var data = {text: scope.confirm};
						if (scope.confirmTitle) {
							data.title = scope.confirmTitle;
						}
						if (scope.confirmOk) {
							data.ok = scope.confirmOk;
						}
						if (scope.confirmCancel) {
							data.cancel = scope.confirmCancel;
						}
						$confirm(data, scope.confirmSettings || {}).then(scope.ngClick);
					} else {
						scope.$apply(scope.ngClick);
					}
				});

			}
		}
	})
/**========================================================== authority directive=============================================*/
	.directive('hasAnyAuthority', ['localStorageService', function (localStorageService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var authorityStr = angular.isDefined(attrs.hasAnyAuthority) ? attrs.hasAnyAuthority.replace(/\s+/g, '') : null;
                if (authorityStr && authorityStr.length > 0) {
                	var user = localStorageService.get('user');
                	var hasAuthority = false;
                	if (user && user.authorities) {
                		var authorities = authorityStr.split(',');
                		for (var i = 0; i < authorities.length; i++) {
                            if (user.authorities.indexOf(authorities[i]) !== -1) {
                            	hasAuthority = true;
                            	break;
                            }
                        }
                	}
                	if (hasAuthority) {
                		element.removeClass('hidden');
                	} else {
                		element.addClass('hidden');
                	}
                }
            }
        };
    }])
    .directive('hasAuthority', ['localStorageService', function (localStorageService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
            	var authorityStr = angular.isDefined(attrs.hasAnyAuthority) ? attrs.hasAnyAuthority.replace(/\s+/g, '') : null;
                if (authorityStr && authorityStr.length > 0) {
                	var user = localStorageService.get('user');
                	if (user && user.authorities && user.authorities.indexOf(authorityStr) !== -1) {
                		element.removeClass('hidden');
                	} else {
                		element.addClass('hidden');
                	}
                }
            }
        };
    }])
/**========================================================== Table ==========================================================*/
	.controller('dpEditModalCtrl', ['$scope', '$http', '$uibModalInstance', 'Upload', 'toastr', 'model', 'config',
	                                function($scope, $http, $uibModalInstance, Upload, toastr, model, config) {
		$scope.model = model;
		$scope.config = config;
		
		$scope.createItem = function(field) {
			var item = {};
			angular.forEach(field.items, function(itemField) {
				item[itemField.name] = angular.isDefined(itemField.defaultValue) ? itemField.defaultValue : null;
			});
    		return item;
		};
		var initSelect = function(field) {
			if (field.type == 'select' || field.type == 'multiselect' || field.select == true) {
        		if (!angular.isDefined(field.options)) {
        			field.options = [];
        		}
        		if (!angular.isDefined(field.optionCache) || field.optionCache) {
        			if (angular.isDefined(field.optionUrl) && !angular.isDefined(field.optionLoaded)) {
        				$http.get(angular.isFunction(field.optionUrl) ? field.optionUrl($scope.model) : field.optionUrl).then(function(response) {
        					field.optionLoaded = true;
        					field.options = response.data.result;
        					if (angular.isDefined(field.onOptionLoaded)) {
        						field.onOptionLoaded(field.options);
        					}
                		});
        			}
    			} else {
    				$http.get(angular.isFunction(field.optionUrl) ? field.optionUrl($scope.model) : field.optionUrl).then(function(response) {
    					field.options = response.data.result;
    					if (angular.isDefined(field.onOptionLoaded)) {
    						field.onOptionLoaded(field.options);
    					}
            		});
    			}
        	}
		}
		angular.forEach(config.fields, function(field) {
			initSelect(field);
        	if (field.type == 'dynamic') {
        		if (!angular.isDefined(model[field.name]) || model[field.name] == null) {
        			model[field.name] = [$scope.createItem(field)];
        		}
        		angular.forEach(field.items, function(itemField) {
        			initSelect(itemField);
        		});
        	}
		});
		$scope.selectRefresh = function(query, field) {
			if (field.onRefresh) {
				field.onRefresh(query, $scope.model, field);
			}
		};
		$scope.cancel = function() {
			$uibModalInstance.dismiss('cancel');
        };
        $scope.upload = function(field, files) {
        	if (!angular.isDefined(config.uploadUrl)) {
        		toastr.error('请配置上传文件处理地址');
        		return;
        	}
        	var fileItems = angular.isArray(files) ? files : [files];
        	angular.forEach(fileItems, function(fileItem) {
        		if (fileItem != null) {
        			Upload.upload({
                        url: config.uploadUrl,
                        data: {file : fileItem, field: field.name}
                    }).then(function (response) {
                    	var linkName = angular.isDefined(field.linkName) ? field.linkName : field.name + 'Url';
                    	$scope.model[linkName] = response.data.result;
                    	toastr.info('上传成功');
                    }, function (response) {
                    	toastr.error("上传失败：" + angular.toJson(response.data));
                    }, function(evt) {
                    	field.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    });
        		}
    		});
        };
        $scope.ok = function(event) {
        	event.preventDefault();
        	if (config.preCommit && !config.preCommit($scope.model)) {
    			return;
    		}
        	angular.forEach(config.fields, function(field) {
        		if (field.name.indexOf('.') > 0) {
        			field.parse.assign($scope.model, $scope.model[field.name]);
        		}
        	});
        	if (angular.isDefined(config.action)) {
        		var httpConfig = {method: angular.isDefined(config.method) ? config.method : 'POST', url: config.action};
				if (config.dataType == 'json') {
    				httpConfig.data = $scope.model;
    			} else {
    				httpConfig.data = toFormString($scope.model);
    				httpConfig.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    			}
				$http(httpConfig).then(function(response) {
    				$uibModalInstance.close(response.data);
     	       	});
    		} else {
    			$uibModalInstance.close($scope.model);
    		}
        };
	}])
	.factory('$editModal', ['$uibModal', '$parse', function ($uibModal, $parse) {
		return function (config) {
			var model =  angular.isDefined(config.model) ? angular.merge({}, config.model) : {};
			angular.forEach(config.fields, function(field) {
				if (field.name.indexOf('.') > 0) {
					if (!angular.isDefined(field.parse)) {
						field.parse = $parse(field.name);
					}
					if (model[field.name] == null) {
						model[field.name] = field.parse(model);
					}
        		}
				if (model[field.name] == null && field.defaultValue) {
					model[field.name] = field.defaultValue;
				}
			});
			return $uibModal.open({
				animation: true, backdrop: 'static',
				templateUrl: angular.isDefined(config.templateUrl) ? config.templateUrl : 'dpEditModal.html', 
				controller: angular.isDefined(config.controller) ? config.controller : 'dpEditModalCtrl', 
				size: angular.isDefined(config.size) ? config.size : '',
    		    resolve: {
    		    	model: function () {return model;},
    		    	config: function() {return config;}
    		    }
		    }).result;
		};
	}])
	.controller('dpTableCtrl', ['$scope', '$http', '$filter', '$window', 'toastr', '$uibModal', '$confirm', '$editModal', '$sce',
	                                  function($scope, $http, $filter, $window, toastr, $uibModal, $confirm, $editModal, $sce) {
		var config = $scope.config;
		$scope.entries = [];
		$scope.input = {keyword: null, field: null, option: null};
		
		$scope.selectItem = function(key, item) {
			config.search[key].item = item;
			$scope.input[key] = item.key;
			if (config.search[key].onChange != null) {
				config.search[key].onChange($scope.input);
			}
			$scope.totalCount = 0;
			$scope.selectPage(1);
		};
		$scope.columnRender = function(column, entry) {
			return $sce.trustAsHtml(column.render(entry));
		};
		var initItem = function(key) {
			for (var i = 0; i < config.search[key].items.length; i++) {
				var item = config.search[key].items[i];
				if (item.key == config.search[key].defaultValue) {
					$scope.selectItem(item);
	    			break;
	    		}
			}
		};
		var loadItems = function(key) {
			if (config.search[key] != null) {
				initItem(key);
				var dataUrl = config.search[key].dataUrl;
				if (dataUrl != null) {
					$http.get(dataUrl).then(function(response) {
						var items = [];
						angular.forEach(config.search[key].items, function(item) {
							items.push(item);
						});
						angular.forEach(response.data.result, function(item) {
							items.push(item);
						});
						config.search[key].items = items;
						initItem(key);
					});
				}
			}
		}
		loadItems("field");
		loadItems("option");
		
		var getPageSuccessCallback = function(response) {
			$scope.entries = response.data.result;
    		$scope.totalCount = response.data.total;
		};
		$scope.selectPage = function(pageNo) {
        	var payload = {size: 10, page: pageNo - 1};
        	if ($scope.input.keyword != null) {
        		var trimKeyword = $scope.input.keyword.trim();
        		if (trimKeyword.length > 0) {
        			payload.keyword = encodeURIComponent(trimKeyword);
        		}
        	}
        	if ($scope.input.field != null) {
        		payload.field = $scope.input.field;
        	}
        	if ($scope.input.option != null) {
        		payload.option = $scope.input.option;
        	}
        	if (config.search.payload != null) {
        		angular.extend(payload, angular.isFunction(config.search.payload) ? config.search.payload(payload) : config.search.payload);
        	}
        	if (payload.pageable === false) {
    			delete payload['page'];
    			delete payload['size'];
    		}
        	if (angular.isDefined(config.restUrl)) {
        		var options = {headers:{'Content-Type': 'application/x-www-form-urlencoded'}};
        		$http.post(config.restUrl + '/list.do', toFormString(payload), options).then(getPageSuccessCallback);
        	} else {
        		if (angular.isDefined(config.pageUrl)) {
        			$http.get(config.pageUrl + '?' + toFormString(payload)).then(getPageSuccessCallback);
        		} else {
        			if (config.dataCallback) {
        				config.dataCallback($scope, payload);
        			} else {
        				toastr.warning('请配置restUrl或pageUrl或dataCallback');
        			}
        		}
        	}
        	$window.scrollTo(0, 0);
        };
        $scope.selectPage(1);
        
        $scope.search = function() {
        	// set totalCount as 0 to make uib-pagination currentPage as 1
    		$scope.totalCount = 0;
    		$scope.selectPage(1);
        };

        $scope.editModal = function(config, entry, data, entries) {
        	//TODO: check config.entity null
        	var model = data ? angular.extend({}, data) : {};
        	if (entry == null) {
        		angular.forEach(config.columns, function(column) {
        			if (column.name != null) {
        				model[column.name] = column.defaultValue;
        			}
    			});
        	} else {
        		angular.extend(model, entry);
        	}
    		$editModal({
    			title: (entry == null ? '新建' : '编辑') + config.entity.name, 
    			action: config.restUrl + (entry == null ? '/add.do' : '/' + entry.id + '.do'),
    			method: (entry == null ? 'POST' : 'PUT'), model: model, fields: config.columns, dataType: 'json', 
    			labelClasses: config.editModalLabelClasses, preCommit: config.preCommit, uploadUrl: config.restUrl + '/upload.do'
    		}).then(function(data) {
    			if (entry == null) {
    				var tempEntries = [].concat(entries == null ? $scope.entries : entries);
        			tempEntries.push(data.result);
        			if (entries) {
        				entries = tempEntries;
        			} else {
        				$scope.entries = tempEntries;
        			}
         		   	toastr.info('添加成功');
    			} else {
    				angular.extend(entry, data.result);
     		   	 	toastr.info('更新成功');
    			}
    		});
        };
        var getSelections = function() {
        	var selections = {length: 0, entries: [], ids: []};
        	angular.forEach($scope.entries, function(entry) {
        		if (entry.isSelected) {
        			selections.length++;
        			selections.entries.push(entry);
        			selections.ids.push(entry.id);
        		}
    		});
        	if (selections.length == 0) {
        		toastr.info("没有选中项");
        		return null;
        	}
        	return selections;
        };
        if (config.action.remove) {
        	$scope.deleteBtnClick = function() {
        		var selections = getSelections();
        		if (selections) {
                	$confirm({text: '你确定要删除这' + selections.length + '项吗?', ok:'删除'}).then(function() {
                		$http.post(config.restUrl + '/delete.do', selections.entries).then(function(response) {
             				angular.forEach(selections.entries, function(entry) {
             					$scope.entries.splice($scope.entries.indexOf(entry), 1);
        	          		});
         					toastr.info("成功删除" + selections.length + '项');
             	     	});
                    });
        		}
            };
        }
        if (config.action.buttons && config.action.buttons.length > 0) {
        	$scope.actionBtnClick = function(buttonEntry) {
        		if (buttonEntry.selections) {
        			var selections = getSelections();
            		if (selections) {
            			buttonEntry.click($scope.entries, $scope.input, selections);
            		}
        		} else {
        			buttonEntry.click($scope.entries, $scope.input);
        		}
        	};
        }
        if (config.action.dropdowns && config.action.dropdowns.length > 0) {
        	$scope.dropdownItemClick = function(dropdownItem) {
        		dropdownItem.click($scope.input);
        	};
        }
        
        //Action Column Items
        var actionColumn = null;
        var actionColumnItems = [];
        if (config.childTable) {
			actionColumnItems.push({
				title: '添加' + config.childTable.entity.name/*TODO: null check*/, classes: 'btn-primary', iconClasses: 'fa fa-plus',
				click: function(entry, input) {
					$scope.editModal(config, entry);
				}
			});
		}
		if (config.action.update) {
			actionColumnItems.push({
				title: '编辑', classes: 'btn-success', iconClasses: 'fa fa-pencil',
				click: function(entry, input) {
					var data = {};
        			angular.forEach(config.childTable.columns, function(childColumn) {
    					if (childColumn.parentColumn) {
    						data[childColumn.name] = entry[childColumn.parentColumn];
    					}
    				});
        			$scope.editModal(config.childTable, entry, data, entry.children);
				}
			});
		}
        for (var i = 0; i < config.columns.length; i++) {
        	var column = config.columns[i];
        	if (column.kind == 'action') {
        		angular.forEach(column.items, function(item) {
        			actionColumnItems.push(item);
        		});
        		actionColumn = column;
        		break;
        	}
        }
        if (actionColumn == null) {
        	actionColumn = {title: '操作', kind: 'action', editable: false, items: actionColumnItems, classes: 'col-md-1'};
        	config.columns.push(actionColumn);
        } else {
        	actionColumn.items = actionColumnItems;
        }
        if (actionColumn.items.length > 0) {
        	$scope.actionColumnBtnClick = function(actionItem, entry) {
        		actionItem.click(entry, $scope.input);
        	};
        }
        
        //================================ Child Table init====================================//
        if (config.childTable) {
        	$scope.columnClick = function(column, entry) {
        		if (column.click) {
        			column.click(entry);
        		} else {
        			if (angular.isDefined(entry.showChildTable)) {
                		entry.showChildTable = !entry.showChildTable;
                	} else {
                		var payload = {};
                		if (config.childTable.payload != null) {
                			angular.extend(payload, angular.isFunction(config.childTable.payload) ? config.childTable.payload(payload) : config.childTable.payload);
                		}
                		var options = {headers:{'Content-Type': 'application/x-www-form-urlencoded'}};
                		$http.post(config.childTable.restUrl + '/list.do', toFromString(payload), options).then(function(response) {
                			entry.children = response.data.result;
                			entry.showChildTable = true;
        	            });
                	}
        		}
            };
            
            var childActionColumn = null;
            var childActionColumnItems = [];
            if (config.childTable.action.update) {
            	childActionColumnItems.push({
            		title: '编辑', classes: 'btn-success', iconClasses: 'fa fa-pencil',
            		click: function(childEntry, entry) {
            			var data = angular.extend({}, childEntry);
            			angular.forEach(config.childTable.columns, function(childColumn) {
        					if (childColumn.parentColumn && childColumn.parentColumn != childColumn.name) {
        						data[childColumn.name] = entry[childColumn.parentColumn];
        					}
        				});
            			$scope.editModal(config.childTable, childEntry, data);
            		}
            	});
    		}
            if (config.childTable.action.remove) {
            	childActionColumnItems.push({
            		title: '删除', classes: 'btn-danger', iconClasses: 'fa fa-remove',
            		click: function(childEntry, entry) {
            			$confirm({text: '你确定要删除这项吗?', ok:'删除'}).then(function() {
                    		$http({method: 'DELETE', url: config.childTable.restUrl + '/' + childEntry.id + '.do'}).then(function(response) {
                    			entry.children.splice(entry.children.indexOf(childEntry), 1);
             					toastr.info('删除成功');
                 	     	});
                        });
            		}
            	});
    		}
            for (var i = 0; i < config.childTable.columns.length; i++) {
            	var column = config.childTable.columns[i];
            	if (column.kind == 'action') {
            		angular.forEach(column.items, function(item) {
            			childActionColumnItems.push(item);
            		});
            		childActionColumn = column;
            		break;
            	}
            }
            if (childActionColumn == null) {
            	childActionColumn = {title: '操作', kind: 'action', editable: false, items: childActionColumnItems, classes: 'col-md-1'};
            	config.childTable.columns.push(childActionColumn);
            } else {
            	childActionColumn.items = childActionColumnItems;
            }
            if (childActionColumn.items.length > 0) {
            	$scope.childActionColumnBtnClick = function(childActionColumn, childEntry, entry) {
            		childActionColumn.click(childEntry, entry);
            	};
            }
        }
	}])
	.directive('dpTable', ['$parse', '$http', function ($parse, $http) {
		return {
			restrict: 'E',
			scope: {
				config: '='
			},
			templateUrl: 'dpTable.html',
			controller: 'dpTableCtrl',
			controllerAs: 'dpTable',
			link: function(scope, element, attrs, ctrl) {
				for (var i = 0; i < scope.config.columns.length; i++) {
					var column = scope.config.columns[i];
					column.parse = $parse(column.name);
				}
				if (angular.isDefined(scope.config.childTable)) {
					for (var i = 0; i < scope.config.childTable.columns.length; i++) {
						var column = scope.config.childTable.columns[i];
						column.parse = $parse(column.name);
					}
				}
			}
		};
	}])
	;
})(angular);