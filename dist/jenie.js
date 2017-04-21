(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Jenie = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Utility = require('./utility');

function Component (element, controller) {
	this.isChangeEventAdded = false;
	this.controller = controller;
	this.isChanging = false;
	this.element = element;
	this.listeners = {};
	this.clone;
}

Component.prototype.on = function (data) {
	if (typeof data.value !== 'function') return;

	var self = this;
	var eventName = data.cmds[1];
	var methodName = data.opts[data.opts.length-1];

	self.element.removeEventListener(eventName, self.listeners[methodName], false);

	self.listeners[methodName] = function (e) {
		e.preventDefault();
		data.value.call(self.controller.model, e);
	};

	self.element.addEventListener(eventName, self.listeners[methodName], false);
};

Component.prototype.each = function (data) {
	var self = this;

	if (!self.clone) self.clone = self.element.children[0];

	var variable = data.cmds.slice(1);
	var child = self.clone.cloneNode(true);
	var inner = '';

	child = child.outerHTML;
	variable = Utility.toCamelCase(variable);
	variable = new RegExp('="'+ variable, 'g');

	for (var i = 0, l = data.value.length; i < l; i++) {
		inner += child.replace(variable, '="' + data.attribute.value + '.' + i.toString());
	}

	self.element.innerHTML = inner;
	self.controller.insert(self.element.getElementsByTagName('*'));
};

Component.prototype.value = function (data) {
	var self = this;

	if (self.element.type === 'checkbox' || self.element.type === 'radio') {
		data.value = self.modifiers(data.attribute.value, data.value);
		self.element.value = data.value;
		self.element.checked = data.value;
	}

	if (self.isChangeEventAdded) return;
	else self.isChangeEventAdded = true;

	var change = function (e) {
		if (self.isChanging) return;
		else self.isChanging = true;

		var element = e.target;
		var value = element.type === 'checkbox' || element.type === 'radio' ? element.checked : element.value;
		var path = element.getAttribute(self.controller.sValue);

		value = self.modifiers(path, value);
		path = path.replace(self.controller.rPath, '');

		// if (element.multiple) {
		// 	var v = Utility.getByPath(self.controller.model, path);
		// 	v.push();
		// 	value = v;
		// }

		Utility.setByPath(self.controller.model, path, value);
		self.isChanging = false;
	};

	self.element.addEventListener('change', change);
	self.element.addEventListener('keyup', change);
};

Component.prototype.html = function (data) {
	this.element.innerHTML = data.value;
	this.controller.insert(this.element.getElementsByTagName('*'));
};

Component.prototype.css = function (data) {
	if (data.cmds.length > 1) data.value = data.cmds.slice(1).join('-') + ': ' +  data.value + ';';
	this.element.style.cssText += data.value;
};

Component.prototype.class = function (data) {
	var className = data.cmds.slice(1).join('-');
	this.element.classList.toggle(className, data.value);
};

Component.prototype.enable = function (data) {
	this.element.disabled = !data.value;
};

Component.prototype.disable = function (data) {
	this.element.disabled = data.value;
};

Component.prototype.show = function (data) {
	this.element.hidden = !data.value;
};

Component.prototype.hide = function (data) {
	this.element.hidden = data.value;
};

Component.prototype.write = function (data) {
	this.element.readOnly = !data.value;
};

Component.prototype.read = function (data) {
	this.element.readOnly = data.value;
};

Component.prototype.selected = function (data) {
	this.element.selectedIndex = data.value;
};

Component.prototype.text = function (data) {
	this.element.innerText = data.value;
};

Component.prototype.default = function (data) {
	var path = Utility.toCamelCase(data.cmds);
	Utility.setByPath(this.element, path, data.value);
};

Component.prototype.modifiers = function (string, value) {
	if (string.indexOf('|') === -1) return value;

	var self = this;
	var modifiers = string.replace(self.controller.rModifier, '').split(' ');

	for (var i = 0, l = modifiers.length; i < l; i++) {
		if (modifiers[i] in self.controller.modifiers) {
			value = self.controller.modifiers[modifiers[i]].call(value);
		}
	}

	return value;
};

Component.prototype.render = function (attribute) {
	var self = this, data = { attribute: attribute };

	data.attribute.value = data.attribute.value.trim();
	data.path = data.attribute.value.replace(self.controller.rPath, '');
	data.command = data.attribute.name.replace(self.controller.rPrefix, '');

	data.opts = data.path.split('.');
	data.cmds = data.command.split('-');

	data.value = Utility.getByPath(self.controller.model, data.path);
	data.value = self.modifiers(data.attribute.value, data.value);

	if (data.value === null || data.value === undefined) return;
	else if (data.cmds[0] in self) self[data.cmds[0]](data);
	else self.default(data);
};

Component.prototype.eachAttribute = function (pattern, callback) {
	var attributes = this.element.attributes;
	var index = 0, length = attributes.length, attribute;

	if (typeof pattern === 'string') pattern = new RegExp(pattern);

	for (index; index < length; index++) {
		attribute = {
			name: attributes[index].name,
			value: attributes[index].value,
			full: attributes[index].name + '="' + attributes[index].value + '"'
		};

		if (pattern && pattern.test(attribute.full)) {
			callback(attribute, index);
		}
	}
};

module.exports = Component;

},{"./utility":4}],2:[function(require,module,exports){
var Component = require('./component');
var Observer = require('./observer');
var Utility = require('./utility');

function Controller (data, callback) {
	this.name = data.name;
	this.scope = data.scope;
	this.view = data.view || {};
	this.model = data.model || {};
	this.doc = data.doc || document;
	this.prefix = data.prefix || 'j';
	this.modifiers = data.modifiers || {};

	this.sPrefix = this.prefix + '-';
	this.sValue = this.prefix + '-value';
	this.sFor = this.prefix + '-for-(.*?)="';
	this.sAccepts = this.prefix + '-' + '(.*?)="';
	this.sRejects = this.prefix + '-controller=|<\w+-\w+|iframe|object|script';
	this.query = '[' + this.prefix + '-controller=' + this.name + ']';

	this.rPath = /(\s)?\|(.*?)$/;
	this.rModifier = /^(.*?)\|(\s)?/;

	this.rFor = new RegExp(this.sFor);
	this.rPrefix = new RegExp(this.sPrefix);
	this.rAccepts = new RegExp(this.sAccepts);
	this.rRejects = new RegExp(this.sRejects);

	// || data.doc.querySelector(this.query);
	// if (!this.scope) throw new Error('missing attribute options.scope or ' + this.prefix + '-controller ');

	if (callback) callback.call(this);
}

Controller.prototype.insert = function (elements) {
	var self = this;

	Utility.eachElement(elements, self.rRejects, null, self.rAccepts, function (element, index) {
		var component = new Component(element, self);

		component.eachAttribute(self.rAccepts, function (attribute) {
			if (self.rFor.test(attribute.name)) index = index + 1;
			if (self.view[attribute.value]) self.view[attribute.value].push(component);
			else self.view[attribute.value] = [component];
			component.render(attribute);
		});
	});
};

Controller.prototype.render = function () {
	var self = this;

	self.model = Observer(self.model, function (path) {
		var paths = path.split('.');
		if (paths.length > 1 && !isNaN(paths.slice(-1))) {
			path = paths.slice(0, -1).join('.');
		}

		var components = self.view[path];
		if (components) {
			for (var i = 0, l = components.length, component; i < l; i++) {
				component = components[i];

				component.eachAttribute(self.sAccepts + path, function (attribute) {
					component.render(attribute);
				});
			}
		}
	});

	self.insert(self.scope.getElementsByTagName('*'));
};

module.exports = function (data, callback) {
	var controller = new Controller(data, callback);
	controller.render();
	return controller;
};

},{"./component":1,"./observer":3,"./utility":4}],3:[function(require,module,exports){

function Obsr () {}

Obsr.prototype.descriptor = function (k, v, c) {
	return {
		configurable: true,
		enumerable: true,
		get: function () {
			return v;
		},
		set: function (nv) {
			v = nv;
			c(k, v);
		}
	};
};

Obsr.prototype.ins = function (observed, callback, prefix, key, value) {

	if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
		value = this.create(value, callback, prefix + key, true);
	}

	if (observed.constructor.name === 'Array' && key == -1) {
		key = 0;
		observed.splice(key, 0, value);
		observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
		key = observed.length-1;
		value = observed[key];
	}

	observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
	if (callback) callback(prefix + key, value);
};

Obsr.prototype.del = function (observed, callback, prefix, key) {
	if (observed.constructor.name === 'Object') {
		delete observed[key];
	} else if (observed.constructor.name === 'Array') {
		var l = observed.length - 1;
		observed.splice(key, 1);
		key = l;
	}

	if (callback) callback(prefix + key, undefined);
};

Obsr.prototype.create = function (observable, callback, prefix, trigger) {
	var observed, key, value, type;

	if (!prefix) prefix = '';
	else prefix += '.';

	type = observable.constructor.name;
	observed = type === 'Object' ? {} : [];

	observed = Object.defineProperty(observed, 'ins', {
		value: this.ins.bind(this, observed, callback, prefix)
	});

	observed = Object.defineProperty(observed, 'del', {
		value: this.del.bind(this, observed, callback, prefix)
	});

	for (key in observable) {
		value = observable[key];
		type = value.constructor.name;

		if (type === 'Object' || type === 'Array') value = this.create(value, callback, prefix + key);
		observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
		if (trigger && callback) callback(prefix + key, value);
	}

	return observed;
};

module.exports = function (observable, callback) {
	return new Obsr().create(observable, callback);
};

},{}],4:[function(require,module,exports){

module.exports = {
	GET: 2,
	SET: 3,

	toCamelCase: function (data) {
		if (data.constructor.name === 'Array') data = data.join('-');
		return data.replace(/-[a-z]/g, function (match) {
			return match[1].toUpperCase();
		});
	},

	toDashCase: function (data) {
		if (data.constructor.name === 'Array') data = data.join('');
		return data.replace(/[A-Z]/g, function (match) {
			return '-' + match.toLowerCase();
		});
	},

	// ensureBoolean: function (value) {
	// 	if (typeof value === 'string') return value === 'true';
	// 	else return value;
	// },
	//
	// ensureString: function (value) {
	// 	if (typeof value === 'object') return JSON.stringify(value);
	// 	else return value.toString();
	// },

	/*
		object
	*/

	interact: function (type, collection, path, value) {
		// var keys = this.toCamelCase(path).split('.');
		var keys = path.split('.');
		var last = keys.length - 1;
		var temporary = collection;

		for (var i = 0; i < last; i++) {
			var property = keys[i];

			if (temporary[property] === null || temporary[property] === undefined) {
				if (type === this.GET) {
					return undefined;
				} else if (type === this.SET) {
					temporary[property] = {};
				}
			}

			temporary = temporary[property];
		}

		if (type === this.GET) {
			return temporary[keys[last]];
		} else if (type === this.SET) {
			temporary[keys[last]] = value;
			return collection;
		}
	},

	getByPath: function (collection, path) {
		return this.interact(this.GET, collection, path);
	},

	setByPath: function (collection, path, value) {
		return this.interact(this.SET, collection, path, value);
	},

	/*
		DOM
	*/

	glance: function (element) {
		var attribute, glance = element.nodeName.toLowerCase();

		for (var i = 0, l = element.attributes.length; i < l; i++) {
			attribute = element.attributes[i];
			glance = glance + ' ' + attribute.name + '="' + attribute.value + '"';
		}

		return glance;
	},

	eachElement: function (elements, reject, skip, accept, callback) {
		for (var index = 0, element, glance; index < elements.length; index++) {
			element = elements[index];
			glance = this.glance(element);

			if (reject && reject.test(glance)) {
				index += element.children.length;
			} else if (skip && skip.test(glance)) {
				continue;
			} else if (accept && accept.test(glance)) {
				callback(element, index);
			}
		}
	}

};

// uid: function () {
// 	return Math.random().toString(36).substr(2, 9);
// },

// eachAttribute: function (attributes, pattern, callback) {
// 	for (var index = 0, attribute; index < attributes.length; index++) {
// 		attribute = {
// 			name: attributes[index].name,
// 			value: attributes[index].value,
// 			full: attributes[index].name + '="' + attributes[index].value + '"'
// 		};
//
// 		if (pattern && pattern.test(attribute.full)) {
// 			callback(attribute, index);
// 		}
// 	}
// },

},{}],5:[function(require,module,exports){

var mime = {
	html: 'text/html',
	text: 'text/plain',
	xml: 'application/xml, text/xml',
	json: 'application/json, text/javascript',
	urlencoded: 'application/x-www-form-urlencoded',
	script: 'text/javascript, application/javascript, application/x-javascript'
};

function serialize (data) {
	var string = '';

	for (var name in data) {
		string = string.length > 0 ? string + '&' : string;
		string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
	}

	return string;
}

function fetch (options) {
	if (!options) throw new Error('fetch: requires options');
	if (!options.action) throw new Error('fetch: requires options.action');
	if (!options.method) options.method = 'GET';
	if (!options.headers) options.headers = {};

	if (options.data) {
		if (options.method === 'GET') {
			options.action = options.action + '?' + serialize(options.data);
			options.data = null;
		} else {
			options.requestType = options.requestType ? options.requestType.toLowerCase() : '';
			options.responseType = options.responseType ? options.responseType.toLowerCase() : '';

			switch (options.requestType) {
				case 'script': options.contentType = mime.script; break;
				case 'json': options.contentType = mime.json; break;
				case 'xml': options.contentType = mime.xm; break;
				case 'html': options.contentType = mime.html; break;
				case 'text': options.contentType = mime.text; break;
				default: options.contentType = mime.urlencoded;
			}

			switch (options.responseType) {
				case 'script': options.accept = mime.script; break;
				case 'json': options.accept = mime.json; break;
				case 'xml': options.accept = mime.xml; break;
				case 'html': options.accept = mime.html; break;
				case 'text': options.accept = mime.text; break;
			}

			if (options.contentType === mime.json) options.data = JSON.stringify(options.data);
			if (options.contentType === mime.urlencoded) options.data = serialize(options.data);
		}
	}

	var xhr = new XMLHttpRequest();
	xhr.open(options.method.toUpperCase(), options.action, true, options.username, options.password);

	if (options.mimeType) xhr.overrideMimeType(options.mimeType);
	if (options.withCredentials) xhr.withCredentials = options.withCredentials;

	if (options.accept) options.headers['Accept'] = options.accept;
	if (options.contentType) options.headers['Content-Type'] = options.contentType;

	if (options.headers) {
		for (var name in options.headers) {
			xhr.setRequestHeader(name, options.headers[name]);
		}
	}

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status >= 200 && xhr.status < 400) {
				return options.success(xhr);
			} else {
				return options.error(xhr);
			}
		}
	};

	xhr.send(options.data);
}

module.exports = {
	mime: mime,
	fetch: fetch,
	serialize: serialize
};

},{}],6:[function(require,module,exports){
/*
	name: jenie
	version: 1.0.3
	author: alexander elias
*/

var Register = require('./register');
var Binder = require('./binder');
var Router = require('./router');
var Http = require('./http');

document.createElement('style').appendChild(document.createTextNode(''));

document.registerElement('j-view', {
	prototype: Object.create(HTMLElement.prototype)
});

module.exports = {

	register: Register,
	router: Router,
	binder: Binder,
	http: Http,

	services: {},

	query: function (query) {
		return document.currentScript ? document.currentScript.ownerDocument.querySelector(query) : document._currentScript.ownerDocument.querySelector(query);
	},
	script: function () {
		return document.currentScript ? document.currentScript : document._currentScript;
	},
	document: function () {
		return document.currentScript ? document.currentScript.ownerDocument : document._currentScript.ownerDocument;
	}

};

},{"./binder":2,"./http":5,"./register":7,"./router":8}],7:[function(require,module,exports){
var Binder = require('../binder');
var Http = require('../http');
var Uuid = require('../uuid');

var url = new RegExp('^http|^\\/|^\\.\\/', 'i');
var html = new RegExp('<|>', 'i');

function getTemplate (path, callback) {
	Http.fetch({
		action: path,
		success: function (result) {
			return callback(result.response);
		},
		error: function (result) {
			throw new Error('getTemplateUrl: ' + result.status + ' ' + result.statusText);
		}
	});
}

function multiline (method) {
	var comment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

	if (typeof method !== 'function') throw new TypeError('Multiline function missing');

	var match = comment.exec(method.toString());

	if (!match) throw new TypeError('Multiline comment missing');

	return match[1];
}

function toDom (data) {
	if (typeof data === 'function') data = multiline(data);
	var container = document.createElement('container');
	container.innerHTML = data;
	return container.children[0];
}

module.exports = function (options) {
	if (!options) throw new Error('Component: missing options');
	if (!options.name) throw new Error('Component: missing name');

	var component = {};
	var isUrl = false;

	component.services = this.services;
	component.proto = Object.create(HTMLElement.prototype);

	component.name = options.name;
	component.model = options.model;
	component.extends = options.extends;
	component.template = options.template;
	component.controller = options.controller;

	if (component.template) {
		if (component.template.constructor.name === 'Function') {
			component.template = toDom(component.template);
		} else if (component.template.constructor.name === 'String') {
			if (url.test(component.template)) {
				isUrl = true;
			} else if (html.test(component.template)) {
				component.template = toDom(component.template);
			} else {
				component.template = document.currentScript ?
				document.currentScript.ownerDocument.querySelector(component.template) :
				document._currentScript.ownerDocument.querySelector(component.template);
			}
		} else {
			component.template = options.template;
		}
	}

	component.proto.attachedCallback = options.attached ? options.attached.bind(component) : null;
	component.proto.detachedCallback = options.detached ? options.detached.bind(component) : null;
	component.proto.attributeChangedCallback = options.attributed ? options.attributed.bind(component) : null;

	component.proto.createdCallback = function () {
		component.element = this;

		function create () {
			component.uuid = Uuid();
			component.element.appendChild(document.importNode(component.template.content, true));
			component.binder = Binder({ name: component.uuid, scope: component.element,  model: component.model }, component.controller);
			if (options.created) options.created.call(component);
		}

		if (isUrl) {
			getTemplate(component.template, function (data) {
				component.template = toDom(data);
				create();
			});
		} else {
			create();
		}
	};

	document.registerElement(component.name, {
		prototype: component.proto,
		extends: component.extends
	});

};

},{"../binder":2,"../http":5,"../uuid":12}],8:[function(require,module,exports){
var Utility = require('./utility');
var Render = require('./render');
var Path = require('./path');

module.exports = {
	render: Render,
	path: Path,
	setup: function (options) {
		var self = this;

		self.components = {};
		self.routes = options.routes || [];
		self.redirects = options.redirects || [];

		self.mode = options.mode;
		self.mode = self.mode === null || self.mode === undefined ? true : self.mode;
		self.mode = 'history' in window && 'pushState' in window.history ? self.mode : false;

		self.ready = 0;
		self.isChangeEvent = true;
		self.base = options.base || '';
		self.external = options.external || '';
		self.root = options.root || (self.mode ? '/' : '/#');
		self.state = { root: self.root, base: self.base, origin: self.path.normalize(self.base + self.root) };

		function init () {
			self.view = document.querySelector('j-view') || document.querySelector('[j-view]');
			self.navigate({ path: window.location.href }, true);
		}

		window.addEventListener('DOMContentLoaded', function () {
			self.ready++;
			if (self.ready === 2) init();
		}, false);

		window.addEventListener('WebComponentsReady', function() {
			self.ready++;
			if (self.ready === 2) init();
		}, false);

		window.addEventListener(self.mode ? 'popstate' : 'hashchange', function (e) {
			if (self.isChangeEvent) {
				var state = self.mode ? e.state : { path: e.newURL }; //&& e.state
				self.navigate(state, true);
			} else {
				self.isChangeEvent = true;
			}
		}, false);

		window.addEventListener('click', function (e) {
			if (e.metaKey || e.ctrlKey || e.shiftKey) return;

			// ensure target is anchor tag use shadow dom if available
			var target = e.path ? e.path[0] : e.target;
			while (target && 'A' !== target.nodeName) target = target.parentNode;
			if (!target || 'A' !== target.nodeName) return;

			// if external not equal the url then ignore
			if (self.external && self.path.path(target.href, self.state.base, self.state.root).indexOf(self.external) !== 0) return;

			// check non acceptable attributes
			if (target.hasAttribute('download') || target.getAttribute('rel') === 'external') return;

			// check non acceptable href
			if (Utility.has(target.href, 'mailto:')) return;
			if (Utility.has(target.href, 'tel:')) return;
			if (Utility.has(target.href, 'file:')) return;
			if (Utility.has(target.href, 'ftp:')) return;

			// check non acceptable origin
			// if (!self.path.isSameOrigin(state.path)) return;

			e.preventDefault();
			// if (!self.path.isSamePath(target.href, self.state.path))
			self.navigate({ path: target.href });
		}, false);

		return self;
	},
	redirect: function (route) {
		var self = this;
		window.location = route.path;
		return self;
	},
	add: function (route) {
		var self = this;

		if (route.constructor.name === 'Object') {
			self.routes.push(route);
		} else if (route.constructor.name === 'Array') {
			self.routes = self.routes.concat(route);
		}

		return self;
	},
	remove: function (path) {
		var self = this;

		for (var i = 0, l = self.routes.length; i < l; i++) {
			var route = self.routes[i];

			if (path === route.path) {
				self.routes.splice(i, 1);
				break;
			}
		}

		return self;
	},
	get: function (path) {
		var self = this;

		var index = 0;
		var route = null;
		var length = self.routes.length;

		for (index; index < length; index++) {
			route = self.routes[index];
			if (!route.path) {
				throw new Error('Router: missing path option');
			} else if (typeof route.path === 'string') {
				if (route.path === path || route.path === '/' + path) {
					return route;
				}
			} else if (typeof route.path === 'function') {
				if (route.path.test(path)) {
					return route;
				}
			}
		}

		route = {};
		route.title = '404';
		route.component = document.createElement('div');
		route.component.innerHTML = '{ "statusCode": 404, "error": "Not Found" }';

		return route;
	},
	change: function (state, replace) {
		var self = this;

		if (self.mode) {
			window.history[replace ? 'replaceState' : 'pushState'](state, state.title, state.origin + state.path);
		} else {
			self.isChangeEvent = false;
			window.location = state.origin + state.path;
		}

		return self;
	},
	navigate: function (state, replace) {
		var self = this;

		self.state.path = self.path.getPath(state.path, self.state.base, self.state.root);
		self.state.hash = self.path.getHash(self.state.path);
		self.state.search = self.path.getSearch(self.state.path);
		self.state.href = self.path.normalize(window.location.href);

		self.route = self.get(self.state.path);
		self.state.title = self.route.title;

		console.log(self.state);

		self.change(self.state, replace);

		if (self.route.redirect) {
			self.redirect(self.route);
		} else {
			self.render(self.route);
		}

		return self;
	}
};

},{"./path":9,"./render":10,"./utility":11}],9:[function(require,module,exports){
module.exports = {
	normalize: function (path) {
		path = decodeURI(path)
		.replace(/\/{2,}/g, '/')
		.replace(/\?.*/, '')
		.replace(/\/$/, '');
		return path === '' ? '/' : path;
	},
	getHash: function (path) {
		return this.normalize(path
			.split('?')[0].split('#')[1] || ''
		);
	},
	getSearch: function (path) {
		return this.normalize(path
			.split('?')[1] || ''
		);
	},
	getPath: function (path, base, root) {
		return this.normalize(path
			.replace(window.location.origin, '/')
			.replace(base, '/')
			.replace(root, '/')
		);
	},
	// isSameOrigin: function (path) {
	// 	return path && path.indexOf(window.location.origin) > -1;
	// },
	// isSamePath: function (pathOne, pathTwo) {
	// 	return this.path(pathOne || '') === this.path(pathTwo || '');
	// },
};

},{}],10:[function(require,module,exports){

module.exports = function (route) {
	var self = this;
	var component = null;

	if (route.title) document.title = route.title;

	if (typeof route.component === 'string') {
		component = self.components[route.component];
		if (!component) {
			component = self.components[route.component] = document.createElement(route.component);
		}
	} else {
		component = route.component;
	}

	if (self.view.firstChild) self.view.removeChild(self.view.firstChild);
	self.view.appendChild(component);
	window.scroll(0, 0);

	// execute scripts
	// var scripts = data.content.match(/<script>[\s\S]+<\/script>/g);
	//
	// if (scripts) {
	// 	scripts.forEach(function (script) {
	// 		script = script.replace(/(<script>)|(<\/script>)/g, '');
	// 		eval(script);
	// 	});
	// }

};

},{}],11:[function(require,module,exports){

module.exports = {
	has: function (string, search) {
		return string.indexOf(search) !== -1;
	}
};

},{}],12:[function(require,module,exports){
// https://gist.github.com/Wind4/3baa40b26b89b686e4f2

var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

module.exports = function () {
	var chars = CHARS, uuid = [];

	// rfc4122, version 4 form
	var r;

	// rfc4122 requires these characters
	uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
	uuid[14] = '4';

	// Fill in random data. At i==19 set the high bits of clock sequence as per rfc4122, sec. 4.1.5
	for (var i = 0; i < 36; i++) {
		if (!uuid[i]) {
			r = 0 | Math.random() * 16;
			uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
		}
	}

	return uuid.join('');
};

},{}]},{},[6])(6)
});