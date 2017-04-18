(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
	this.doc = data.doc;
	this.name = data.name;
	this.view = data.view || {};
	this.model = data.model || {};
	this.modifiers = data.modifiers || {};

	this.sPrefix = data.prefix + '-';
	this.sValue = data.prefix + '-value';
	this.sFor = data.prefix + '-for-(.*?)="';
	this.sAccepts = data.prefix + '-' + '(.*?)="';
	this.sRejects = data.prefix + '-controller=|' + data.rejects;
	this.query = '[' + data.prefix + '-controller=' + data.name + ']';

	this.rPath = /(\s)?\|(.*?)$/;
	this.rModifier = /^(.*?)\|(\s)?/;

	this.rFor = new RegExp(this.sFor);
	this.rPrefix = new RegExp(this.sPrefix);
	this.rAccepts = new RegExp(this.sAccepts);
	this.rRejects = new RegExp(this.sRejects);

	this.scope = data.doc.querySelector(this.query);
	if (!this.scope) throw new Error('missing attribute s-controller ' + data.name);

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

module.exports = {
	prefix: 's',
	doc: document,
	controllers: {},
	rejects: 'iframe|object|script',
	controller: function (data, callback) {
		if (!data.name) throw new Error('Controller - name parameter required');

		data.doc = data.doc || this.doc;
		data.prefix = data.prefix || this.prefix;
		data.rejects = data.rejects || this.rejects;

		this.controllers[data.name] = new Controller(data, callback);
		if (!callback) this.controllers[data.name].render();
		return this.controllers[data.name];
	}
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
var Binder = require('../binder');

function getTemplateUrl (path, callback) {
	var xhr = new XMLHttpRequest();

	xhr.open('GET', path, true);
	xhr.onreadystatechange = onreadystatechange;
	xhr.send();

	function onreadystatechange () {
		if (xhr.readyState === xhr.DONE && xhr.status === 200) return callback(xhr.response);
		else if (xhr.readyState === xhr.DONE && xhr.status !== 200) throw new Error('getTemplateUrl: ' + xhr.status + ' ' + xhr.statusText);
	}
}

function multiline (fn) {
	var multilineComment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

	if (typeof fn !== 'function') throw new TypeError('Multiline function missing');

	var match = multilineComment.exec(fn.toString());

	if (!match) throw new TypeError('Multiline comment missing');

	return match[1];
}

function getAttributeObject (element, attribute) {
	var attributes = element.attributes;
	var self = {};

	for (var c = 0; c < element.attributes.length; c++) {
		attribute[attributes[c].name] = attributes[c].value;
	}

	function options (name) {
		return {
			enumerable:true,
			configurable: true,
			get: function () {
				return attribute[name];
			},
			set: function (value) {
				attribute[name] = value;
				element.setAttribute(name, value);
			}
		};
	}

	for (var i = 0; i < attributes.length; i++) {
		var name = attributes[i].name;
		Object.defineProperty(self, name, options(name));
	}

	return self;
}

function toDom (data) {
	if (typeof data === 'function') data = multiline(data);
	var container = document.createElement('container');
	container.innerHTML = data;
	return container.children[0];
}

var isUrl = new RegExp('(^https?:\\/\\/)|(^\\/[^\\/\\*])|(^\\.\\/)', 'i');
var isHtml = new RegExp('(^<.*?>)', 'i');

/*
	main
*/

function Component (opt) {
	var self = this;

	if (!opt) throw new Error('Curium.component: missing options');
	if (!opt.tag) throw new Error('Curium.component: missing tag');

	if (!opt.template) {
		self.template = document.createElement('template');
	} else if (opt.template.constructor.name === 'Function') {
		self.template = toDom(opt.template);
	} else if (opt.template.constructor.name === 'String') {
		if (isUrl.test(opt.template)) {
			self.template = null;
		} else if (isHtml.test(opt.template)) {
			self.template = toDom(opt.template);
		} else {
			self.template = document.currentScript ?  document.currentScript.ownerDocument.querySelector(opt.template) : document._currentScript.ownerDocument.querySelector(opt.template);
		}
	} else {
		self.template = opt.template;
	}

	if (opt.proto) opt.proto = Object.create(opt.proto);
	else opt.proto = Object.create(HTMLElement.prototype);

	self.tag = opt.tag;
	self.model = opt.model;
	self.controller = opt.controller;
	self.element = document.querySelector(opt.tag);
	self.attribute = getAttributeObject(self.element, {});

	self.render = function (element) {
		if (opt.created) opt.created(self);
		var name = self.tag + '-'  + Date.now().toString();
		element.appendChild(document.importNode(self.template.content, true));
		element.setAttribute('c-controller', name);
		Binder.controller({ prefix: 'c', name: name, model: self.model, }, self.controller);
	};

	opt.proto.attachedCallback = function () {
		if (opt.attached) opt.attached(self);
	};

	opt.proto.detachedCallback = function () {
		if (opt.detached) opt.detached(self);
	};

	opt.proto.attributeChangedCallback = function (name, oldValue, newValue) {
		if (opt.attributed) opt.attributed(self, name, oldValue, newValue);
	};

	opt.proto.createdCallback = function () {
		var element = this;

		if (self.template) {
			self.render(element);
		} else if (opt.template) {
			getTemplateUrl(opt.template, function (data) {
				self.template = toDom(data);
				self.render(element);
			});
		} else if (opt.created) {
			opt.created(self);
		}
	};

	document.registerElement(opt.tag, {
		prototype: opt.proto,
		extends: opt.extends
	});

}

module.exports = {
	components: {},
	component: function (opt) {
		return this.components[opt.tag] = new Component(opt);
	},
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

// if (!window.Curium) {
// 	window.addEventListener('DOMContentLoaded', function () {
// 		document.body.style.opacity = 0; // hide body
// 	});
//
// 	window.addEventListener('WebComponentsReady', function() {
// 		document.body.style.opacity = 1; // show body
// 	});
//
// 	window.Curium = {
// 		components: {},
// 		component: function (opt) {
// 			return this.components[opt.tag] = new Component(opt);
// 		},
// 		query: function (query) {
// 			return document.currentScript ? document.currentScript.ownerDocument.querySelector(query) : document._currentScript.ownerDocument.querySelector(query);
// 		},
// 		script: function () {
// 			return document.currentScript ? document.currentScript : document._currentScript;
// 		},
// 		document: function () {
// 			return document.currentScript ? document.currentScript.ownerDocument : document._currentScript.ownerDocument;
// 		}
// 	};
// }

},{"../binder":2}],6:[function(require,module,exports){

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

},{}],7:[function(require,module,exports){
var Component = require('./component');
var Binder = require('./binder');
var Router = require('./router');
var Http = require('./http');

module.exports = {
	component: Component,
	binder: Binder,
	router: Router,
	http: Http
};

},{"./binder":2,"./component":5,"./http":6,"./router":8}],8:[function(require,module,exports){
var Utility = require('./utility');
var Render = require('./render');
var Request = require('./request');
var Response = require('./response');

var PUSH = 2;
var REPLACE = 3;
var MODE = 'history' in window && 'pushState' in window.history;

function Router (options) {
	this.name = options.name;

	this.base = options.base;
	this.routes = options.routes || [];
	this.redirects = options.redirects || [];
	this.query = options.query || '[r-view="'+ this.name +'"]';
	this.authorize = options.authorize || function () { return true; };

	this.isListening = false;
	this.permitChangeEvent = true;
	this.state = options.state || {};
	this.location = document.location;

	this.mode = options.mode === null || options.mode === undefined ? MODE : options.mode;
	this.root = options.root === null || options.root === undefined ? (this.mode ? '/' : '#/') : options.root;
}

Router.prototype.isSameOrigin = function (path) {
	return path && path.indexOf(document.location.origin) > -1;
};

Router.prototype.isSamePath = function (pathOne, pathTwo) {
	return Utility.clean(pathOne || '') === Utility.clean(pathTwo || '');
};

Router.prototype.add = function (route) {
	var self = this;

	if (route.constructor.name === 'Object') {
		self.routes.push(route);
	} else if (route.constructor.name === 'Array') {
		self.routes = self.routes.concat(route);
	}

	return self;
};

Router.prototype.remove = function (path) {
	var self = this;

	for (var i = 0, l = self.routes.length; i < l; i++) {
		var route = self.routes[i];

		if (path === route.path) {
			self.routes.splice(i, 1);
			break;
		}
	}

	return self;
};

Router.prototype.get = function (path) {
	var self = this;

	var length = self.routes.length;
	var route = null;
	var index = 0;

	path = Utility.strip(path);

	for (index; index < length; index++) {
		route = self.routes[index];
		if (typeof route.path === 'string') {
			if (route.path === path || route.path === '/' + path) {
				return route;
			}
		} else if (route.path.test(path)) {
			return route;
		}
	}
};

Router.prototype.navigate = function (state, type) {
	var self = this;

	type = type === null || type === undefined ? PUSH : type;
	state = typeof state === 'string' ? { path: state } : state;

	var route = self.get(state.path);

	self.state.title = route && route.title ? route.title : state.title;
	self.state.path = self.mode ? self.root + Utility.clean(state.path) : self.root + Utility.clean(state.path);

	var data = {
		route: route,
		state: this.state,
		query: this.query,
		href: document.location.href,
		hash: Utility.getHash(this.href),
		search: Utility.getSearch(this.href),
		pathname: Utility.getPathname(this.href)
	};

	if (self.authorize(Request(data), Response(data)) === false) {
		Render({
			type: 'text',
			title: '401',
			text: '{"statusCode":401,"error":"Missing Authentication"}'
		});

		return self;
	}

	if (self.mode) {
		if (type === PUSH) window.history.pushState(self.state, self.state.title, self.state.path);
		if (type === REPLACE) window.history.replaceState(self.state, self.state.title, self.state.path);
	} else {
		self.permitChangeEvent = false;
		window.location.hash = self.state.path;
	}

	if (route) {
		route.handler(Request(data), Response(data));
	} else {
		Render({
			type: 'text',
			title: '404',
			text: '{"statusCode":404,"error":"Not Found"}'
		});
	}

	return self;
};

Router.prototype.listen = function () {
	var self = this;

	if (self.isListening) return self;
	else self.isListening = true;

	window.addEventListener('DOMContentLoaded', function () {
		var state = { title: document.title, path: document.location.href };
		self.navigate(state, REPLACE);
	}, false);

	window.addEventListener(self.mode ? 'popstate' : 'hashchange', function (e) {
		if (self.permitChangeEvent) {
			var state = {};

			if (self.mode) state = e.state || {};
			else state = { path: e.newURL };

			self.navigate(state);
		} else {
			self.permitChangeEvent = true;
		}
	}, false);

	window.addEventListener('click', function (e) {
		if (e.metaKey || e.ctrlKey || e.shiftKey) return;

		// ensure target is anchor tag use shadow dom if available
		var target = e.path ? e.path[0] : e.target;
		while (target && 'A' !== target.nodeName) target = target.parentNode;
		if (!target || 'A' !== target.nodeName) return;

		// check non acceptable attributes
		if (target.hasAttribute('r-ignore') || target.hasAttribute('download') || target.getAttribute('rel') === 'external') return;

		var state = {
			path: target.href || '',
			title: target.title || ''
		};

		// if base and base not equal the url then ignore
		if (self.base && Utility.getPathname(state.path).indexOf(self.base) !== 0) return;

		// check non acceptable href
		if (Utility.has(state.path, 'mailto:')) return;
		if (Utility.has(state.path, 'tel:')) return;
		if (Utility.has(state.path, 'file:')) return;
		if (Utility.has(state.path, 'ftp:')) return;

		// check non acceptable origin
		if (!self.isSameOrigin(state.path)) return;

		e.preventDefault();

		// check for same path
		if (self.isSamePath(state.path, self.state.path)) return;

		self.navigate(state, PUSH);
	}, false);

	return self;
};

module.exports = {
	PUSH: PUSH,
	REPLACE: REPLACE,

	routers: {},
	redirect: function (path) {
		window.location = path;
	},
	router: function (options) {
		if (!options.name) throw new Error('Router - name parameter required');
		if (this.routers[options.name]) throw new Error('Router - name ' + options.name + ' exists');
		this.routers[options.name] = new Router(options);
		return this.routers[options.name];
	}
};

},{"./render":9,"./request":10,"./response":11,"./utility":12}],9:[function(require,module,exports){

function Render (data) {
	if (data.title !== null && data.title !== undefined) document.title = data.title;
	if (data.type === 'text') document.querySelector(data.query).innerText = data.content;
	else if (data.type === 'html') document.querySelector(data.query).innerHTML = data.content;
	else document.querySelector(data.query).innerText = '505 Router Error';

	window.scroll(0, 0);

	// execute scripts
	var scripts = data.content.match(/<script>[\s\S]+<\/script>/g);

	if (scripts) {
		scripts.forEach(function (script) {
			script = script.replace(/(<script>)|(<\/script>)/g, '');
			eval(script);
		});
	}

}

module.exports = Render;

},{}],10:[function(require,module,exports){

function Request (data) {
	this.route = data.route;
	this.state = data.state;
}

module.exports = function (data) {
	return new Request(data);
};

},{}],11:[function(require,module,exports){
var Render = require('./render');
var Http = require('../http');

function Response (data) {
	this.query = data.query;
	this.route = data.route;
}

Response.prototype.send = function (content, callback) {
	var self = this;

	Render({
		type: 'html',
		query: self.query,
		title: self.route.title,
		content: content
	});

	if (callback) return callback();
};

Response.prototype.file = function (path, callback) {
	var self = this;

	Http.fetch({
		action: path,
		responseType: 'html',
		success: function (xhr) {
			Render({
				type: 'html',
				query: self.query,
				title: self.route.title,
				content: xhr.response
			});

			if (callback) return callback();
		},
		error: function (xhr) {
			Render({
				type: 'text',
				query: self.query,
				title: self.route.title,
				content: xhr.response
			});

			if (callback) return callback();
		}
	});
};

Response.prototype.redirect = function (path) {
	window.location = path;
};

module.exports = function (data) {
	return new Response(data);
};

},{"../http":6,"./render":9}],12:[function(require,module,exports){

function has (string, search) {
	return string.indexOf(search) !== -1;
}

function clean (s) {
	return decodeURI(s)
	.replace(document.location.origin, '')
	.replace(/(^\/?#?\/)/, '')
	.replace(/(\/$)/, '');
}

function strip (s) {
	return clean(s).replace(/(\?.*?$)|(#.*?$)/g, '');
}

function getSearch (s) {
	return clean(s).split('?')[1] || '';
}

function getHash (s) {
	return clean(s).split('?')[0].split('#')[1] || '';
}

function getPathname (s) {
	return clean(s).split('?')[0].split('#')[0] || '';
}

module.exports = {
	has: has,
	clean: clean,
	strip: strip,
	getSearch: getSearch,
	getHash: getHash,
	getPathname: getPathname
};

},{}]},{},[7]);
