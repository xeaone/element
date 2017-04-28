(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Jenie = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Model = require('./model');
var View = require('./view');

function Binder () {}

Binder.prototype.create = function (options, callback) {
	var self = this;

	Object.defineProperties(self, {
		name: {
			value: options.name
		},
		modifiers: {
			value: options.modifiers || {}
		},
		collection: {
			value: options.model || {}
		},
		_view: {
			value: View()
		},
		_model: {
			value: Model()
		},
		view: {
			enumerable: true,
			get: function () {
				return self._view.data;
			}
		},
		model: {
			enumerable: true,
			get: function () {
				return self._model.data;
			}
		},
		elements: {
			get: function () {
				return (options.view.shadowRoot || options.view).querySelectorAll('*');
			}
		}
	});

	self._model.setup(self.collection, function (path, value) {
		self._view.units(path).forEach(function (unit) {
			unit.data = value;
			unit.render();
		});
	});

	self._view.setup(self.elements, function (unit) {
		unit.binder = self;
		unit.data = self._model.get(unit.attribute.path);
		unit.render();
		return unit;
	});

	if (callback) callback.call(self);

	return self;
};

module.exports = function (options, callback) {
	return new Binder().create(options, callback);
};

},{"./model":2,"./view":5}],2:[function(require,module,exports){
var Utility = require('./utility');

function Model () {}

Model.prototype.ins = function (model, callback, prefix, key, value) {

	if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
		// could callback on each added here
		value = this.observe(value, callback, prefix + key, true);
	}

	// if (model.constructor.name === 'Array' && key == -1) {
	// 	key = 0;
	// 	model.splice(key, 0, value);
	// 	model = Object.defineProperty(model, key, this.descriptor(prefix + key, value, callback));
	// 	key = model.length-1;
	// 	value = model[key];
	// }

	model = Object.defineProperty(model, key, this.descriptor(prefix + key, value, callback));

	if (callback) callback(prefix.slice(0, -1), model);
	// if (callback) callback(prefix + key, value);
};

Model.prototype.del = function (model, callback, prefix, key) {
	if (model.constructor.name === 'Object') {
		delete model[key];
		if (callback) callback(prefix + key, undefined);
	} else if (model.constructor.name === 'Array') {
		// var l = model.length - 1;
		model.splice(key, 1);
		// key = l;
		if (callback) callback(prefix.slice(0, -1), model);
	}
};

Model.prototype.each = function (collection, callback) {
	var key;

	if (!collection) {
		throw new Error('not a collection');
	} else if (collection.constructor.name === 'Array') {
		if (collection.length === 0) return;
		for (key = 0; key < collection.length; key++) {
			callback(collection[key], key);
		}
	} else if (collection.constructor.name === 'Object') {
		if (Object.keys(collection).length === 0) return;
		for (key in collection) {
			callback(collection[key], key);
		}
	}
};

Model.prototype.descriptor = function (key, value, callback) {
	return {
		configurable: true,
		enumerable: true,
		get: function () {
			return value;
		},
		set: function (newValue) {
			value = newValue;
			callback(key, value);
		}
	};
};

Model.prototype.observe = function (collection, callback, prefix) {
	var self = this, properties = {}, data;

	prefix = !prefix ? '' : prefix += '.';
	data = collection.constructor.name === 'Object' ? {} : [];

	properties.ins = {
		value: self.ins.bind(self, data, callback, prefix)
	};

	properties.del = {
		value: self.del.bind(self, data, callback, prefix)
	};

	self.each(collection, function (value, key) {
		if (value !== null && value !== undefined) {
			if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
				value = self.observe(value, callback, prefix + key);
			}
		}

		properties[key] = self.descriptor(prefix + key, value, callback);
	});

	return Object.defineProperties(data, properties);
};

Model.prototype.get = function (path) {
	return Utility.getByPath(this.data, path);
};

Model.prototype.set = function (path, data) {
	return Utility.setByPath(this.data, path, data);
};

Model.prototype.setup = function (collection, callback) {
	this.data = this.observe(collection, callback);
};

Model.prototype.create = function (options) {
	var self = this;
	options = options || {};
	self.data = options.data || {};
	return self;
};

module.exports = function (options) {
	return new Model().create(options);
};

},{"./utility":4}],3:[function(require,module,exports){
var Utility = require('./utility');
// var Uuid = require('../uuid');

function Unit () {}

Unit.prototype.attributes = {
	on: function () {
		var self = this;

		if (typeof self.data !== 'function') return;

		var eventName = self.attribute.cmds[1];
		var methodName = self.attribute.opts[self.attribute.opts.length-1];

		self.element.removeEventListener(eventName, self.listeners[methodName], false);

		self.listeners[methodName] = function (e) {
			e.preventDefault();
			self.data.call(self, e);
		};

		self.element.addEventListener(eventName, self.listeners[methodName], false);
	},
	each: function () {
		var self = this;

		if (!self.container) self.container = document.createElement('div');
		if (!self.clone) self.clone = self.element.cloneNode(true);
		if (!self.children) self.children = [];
		console.log(this);

		var variable = self.attribute.cmds.slice(1).join('.');
		var pattern = new RegExp('((data-)?j(-(\\w)+)+=\")' + variable + '\"', 'g');

		self.data.forEach(function (data, index) {
			self.container.innerHTML = self.clone.cloneNode(true).innerHTML
			.replace(pattern, '$1' + self.attribute.path + '.' + index.toString() + '\"');

			if (self.element.children[index]) {
				self.element.replaceChild(self.container.children[0], self.element.children[index]);
			} else if (self.element.children.length < self.data.length) {
				self.element.appendChild(self.container.children[0]);
			}
		});

		if (self.element.children.length > self.data.length) {
			while (self.element.children.length > self.data.length) {
				self.element.removeChild(self.element.children[self.element.children.length-1]);
			}
		}

		self.children.forEach(function (child, index) {
			self.children.slice(index, 1);
			self.binder._view.remove(child.path, child.index);
		});

		self.binder._view.set(self.element.getElementsByTagName('*'), function (unit, path, index) {
			unit.binder = self.binder;
			unit.data = self.binder._model.get(unit.attribute.path);
			unit.render();
			self.children.push({ path: path, index: index });
			return unit;
		});

	},
	value: function () {
		var self = this;

		if (self.element.type === 'checkbox' || self.element.type === 'radio') {
			self.element.value = self.data;
			self.element.checked = self.data;
		}

		if (self.isChangeEventAdded) return;
		else self.isChangeEventAdded = true;

		var change = function (e) {
			if (self.isChanging) return;
			else self.isChanging = true;

			var element = e.target;
			var value = element.type === 'checkbox' || element.type === 'radio' ? element.checked : element.value;

			self.binder._model.set(self.attribute.path, value);
			self.isChanging = false;
		};

		self.element.addEventListener('change', change);
		self.element.addEventListener('keyup', change);
	},
	html: function () {
		this.element.innerHTML = this.data;
		// this.binder.insert(this.element.getElementsByTagName('*'));
	},
	css: function () {
		var css = this.data;
		if (this.attribute.cmds.length > 1) css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
		this.element.style.cssText += css;
		// if (this.attribute.cmds.length > 1) this.data = this.attribute.cmds.slice(1).join('-') + ': ' +  this.data + ';';
		// this.element.style.cssText += this.data;
	},
	class: function () {
		var className = this.attribute.cmds.slice(1).join('-');
		this.element.classList.toggle(className, this.data);
	},
	text: function () {
		this.element.innerText = this.data;
	},
	enable: function () {
		this.element.disabled = !this.data;
	},
	disable: function () {
		this.element.disabled = this.data;
	},
	show: function () {
		this.element.hidden = !this.data;
	},
	hide: function () {
		this.element.hidden = this.data;
	},
	write: function () {
		this.element.readOnly = !this.data;
	},
	read: function () {
		this.element.readOnly = this.data;
	},
	selected: function () {
		this.element.selectedIndex = this.data;
	},
	default: function () {
		var path = Utility.toCamelCase(this.attribute.cmds);
		Utility.setByPath(this.element, path, this.data);
	}
};

Unit.prototype.render = function () { //data
	var self = this;

	// self.data = data === undefined ? self.data : self.data = data;

	self.attributes[
		self.attribute.cmds[0] in self.attributes ?
		self.attribute.cmds[0] :
		'default'
	].call(self);

	return self;
};

Unit.prototype.create = function (options) {
	var self = this;

	self.attribute = options.attribute;
	self.element = options.element;
	self.binder = options.binder;

	self.isChangeEventAdded = false;
	self.isChanging = false;
	self.isNew = true;
	self.listeners = {};

	self._data, self.clone;

	Object.defineProperty(self, 'data', {
		configurable: true,
		enumerable: true,
		get: function () {

			// if (self._data === undefined) {
			// 	self._data = self.binder._model.get(self.attribute.path);
			// }

			self.attribute.modifiers.forEach(function (modifier) {
				self._data = self.binder.modifiers[modifier].call(self._data);
			});

			return self._data;
		},
		set: function (value) {
			self._data = value;
		}
	});

	return self;
};

module.exports = function (options) {
	return new Unit().create(options);
};

},{"./utility":4}],4:[function(require,module,exports){

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

	interact: function (type, collection, path, value) {
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

	// glance: function (element) {
	// 	var attribute, glance = element.nodeName.toLowerCase();
	//
	// 	for (var i = 0, l = element.attributes.length; i < l; i++) {
	// 		attribute = element.attributes[i];
	// 		glance = glance + ' ' + attribute.name + '="' + attribute.value + '"';
	// 	}
	//
	// 	return glance;
	// },
	//
	// eachElement: function (elements, reject, skip, accept, callback) {
	// 	for (var index = 0, element, glance; index < elements.length; index++) {
	// 		element = elements[index];
	// 		glance = this.glance(element);
	//
	// 		if (reject && reject.test(glance)) {
	// 			index += element.children.length;
	// 		} else if (skip && skip.test(glance)) {
	// 			continue;
	// 		} else if (accept && accept.test(glance)) {
	// 			callback(element, index);
	// 		}
	// 	}
	// }

};

},{}],5:[function(require,module,exports){
var Global = require('../global');
var Unit = require('./unit');

var PATH = Global.rPath;
var PREFIX = Global.rPrefix;
var MODIFIERS = Global.rModifier;
var ATTRIBUTE_ACCEPTS = Global.rAttributeAccepts;
var ELEMENT_ACCEPTS = Global.rElementAccepts;
var ELEMENT_REJECTS = Global.rElementRejects;
var ELEMENT_REJECTS_CHILDREN = Global.rElementRejectsChildren;

function View () {}

View.prototype.glance = function (element) {
	return element.outerHTML
	.replace(/(\/)?>.*$/, '')
	.replace(/^</, '');
};

View.prototype.eachElement = function (elements, callback) { //skip,
	var element, glance, i;

	for (i = 0; i < elements.length; i++) {
		element = elements[i];
		glance = this.glance(element);

		if (ELEMENT_REJECTS.test(glance)) {
			i += element.children.length;
		} else if (ELEMENT_REJECTS_CHILDREN.test(glance)) {
			i += element.children.length;
			callback(element);
		// } else if (skip && skip.test(glance)) {
		// 	continue;
		} else if (ELEMENT_ACCEPTS.test(glance)) {
			callback(element);
		}
	}
};

View.prototype.eachAttribute = function (element, callback) {
	var attributes = element.attributes, attribute, i;

	for (i = 0; i < attributes.length; i++) {
		attribute = {};
		attribute.name = attributes[i].name;
		attribute.value = attributes[i].value;

		if (ATTRIBUTE_ACCEPTS.test(attribute.name)) {
			attribute.path = attribute.value.replace(PATH, '');
			attribute.opts = attribute.path.split('.');
			attribute.command = attribute.name.replace(PREFIX, '');
			attribute.cmds = attribute.command.split('-');

			if (attribute.value.indexOf('|') === -1) {
				attribute.modifiers = [];
			} else {
				attribute.modifiers = attribute.value.replace(MODIFIERS, '').split(' ');
			}

			callback(attribute);
		}

	}
};

View.prototype.units = function (path) {
	return this.data[path] || [];
};

View.prototype.paths = function () {
	return Object.keys(this.data);
};

View.prototype.setup = function (elements, callback) {
	var self = this;

	self.eachElement(elements, function (element) {
		self.eachAttribute(element, function (attribute) {
			if (!(attribute.path in self.data)) self.data[attribute.path] = [];
			self.data[attribute.path].push(callback(Unit({ element: element, attribute: attribute })));

		});
	});

	return self;
};

View.prototype.set = function (elements, callback) {
	var self = this;

	self.eachElement(elements, function (element) {
		self.eachAttribute(element, function (attribute) {
			if (!(attribute.path in self.data)) self.data[attribute.path] = [];
			self.data[attribute.path].push(
				callback(
					Unit({ element: element, attribute: attribute }),
					attribute.path, self.data[attribute.path].length-1
				)
			);

		});
	});

	return self;
};

View.prototype.remove = function (path, index) {
	var self = this;
	if (path in self.data) {
		self.data[path].splice(index, 1);
		if (self.data[path].length === 0) delete self.data[path];
	}
	return self;
};

View.prototype.create = function (options) {
	var self = this;
	options = options || {};
	self.data = options.data || {};
	return self;
};

module.exports = function (options) {
	return new View().create(options);
};

},{"../global":7,"./unit":3}],6:[function(require,module,exports){
var Binder = require('../binder');
var Uuid = require('../uuid');

function Component () {}

Component.prototype.comment = function (method) {
	if (typeof method !== 'function') throw new Error('Comment must be a function');
	var comment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;
	var match = comment.exec(method.toString());
	if (!match) throw new Error('Comment missing');
	return match[1];
};

Component.prototype.dom = function (string) {
	var temporary = document.createElement('div');
	temporary.innerHTML = string;
	return temporary.children[0];
};

Component.prototype._template = function (template) {
	if (template.constructor.name === 'Function') {
		template = this.comment(template);
		template = this.dom(template);
	} else if (template.constructor.name === 'String') {
		if (/<|>/.test(template)) {
			template = this.dom(template);
		} else {
			template = this.currentScript.ownerDocument.querySelector(template);
		}
	}

	return template;
};

Component.prototype.define = function (options) {
	var key, name;

	for (key in options) {
		if (key === 'name') {
			name = options.name;
			delete options.name;
		} else {
			options[key] = { value: options[key] };
		}
	}

	return document.registerElement(name, {
		prototype: Object.create(HTMLElement.prototype, options)
	});
};

Component.prototype.create = function (options) {
	if (!options) throw new Error('missing options');
	if (!options.name) throw new Error('missing options.name');
	if (!options.template) throw new Error('missing options.template');

	var self = this;

	self.name = options.name;
	self.model = options.model;
	// self.services = options.services;
	self.modifiers = options.modifiers;
	self.controller = options.controller;
	self.currentScript = (document._currentScript || document.currentScript);

	self.template = self._template(options.template);

	if (options.created) self.created = options.created.bind(self);
	if (options.attached) self.attached = options.attached.bind(self);
	if (options.detached) self.detached = options.detached.bind(self);
	if (options.attributed) self.attributed = options.attributed.bind(self);

	self.proto = self.define({
		name: self.name,
		attachedCallback: self.attached,
		detachedCallback: self.detached,
		attributeChangedCallback: self.attributed,
		createdCallback: function () {
			self.element = this;
			self.uuid = Uuid();
			self.element.appendChild(document.importNode(self.template.content, true));

			if (self.model || self.controller) {
				self.binder = Binder({
					name: self.uuid,
					model: self.model,
					view: self.element,
					modifiers: self.modifiers
				}, self.controller);

				self.model = self.binder.model;
			}

			if (self.created) self.created.call(self);
		}
	});

	return self;
};

module.exports = function (options) {
	return new Component().create(options);
};

},{"../binder":1,"../uuid":12}],7:[function(require,module,exports){

module.exports = {

	sViewElement: 'j-view',

	sPrefix: '(data-)?j-',
	sValue: '(data-)?j-value',
	sFor: '(data-)?j-for-(.*?)=',

	sAccepts: '(data-)?j-',
	sRejects: '^\w+(-\w+)+|^iframe|^object|^script',

	rPath: /\s?\|(.*?)$/,
	rPrefix: /(data-)?j-/,
	rValue: /(data-)?j-value/,
	rModifier: /^(.*?)\|\s?/,
	rFor: /(data-)?j-for-(.*?)=/,

	rAccepts: /(data-)?j-/,
	rRejects: /^\w+(-\w+)+|^iframe|^object|^script/,

	rAttributeAccepts: /(data-)?j-/,

	rElementAccepts: /(data-)?j-/,
	rElementRejectsChildren: /(data-)?j-each/,
	rElementRejects: /^\w+(-\w+)+|^iframe|^object|^script/

};

},{}],8:[function(require,module,exports){

function Http () {}

Http.prototype.mime = {
	html: 'text/html',
	text: 'text/plain',
	xml: 'application/xml, text/xml',
	json: 'application/json, text/javascript',
	urlencoded: 'application/x-www-form-urlencoded',
	script: 'text/javascript, application/javascript, application/x-javascript'
};

Http.prototype.serialize = function (data) {
	var string = '';

	for (var name in data) {
		string = string.length > 0 ? string + '&' : string;
		string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
	}

	return string;
};

Http.prototype.fetch = function (options) {
	var self = this;

	if (!options) throw new Error('fetch: requires options');
	if (!options.action) throw new Error('fetch: requires options.action');
	if (!options.method) options.method = 'GET';
	if (!options.headers) options.headers = {};

	if (options.data) {
		if (options.method === 'GET') {
			options.action = options.action + '?' + self.serialize(options.data);
			options.data = null;
		} else {
			options.requestType = options.requestType ? options.requestType.toLowerCase() : '';
			options.responseType = options.responseType ? options.responseType.toLowerCase() : '';

			switch (options.requestType) {
				case 'script': options.contentType = self.mime.script; break;
				case 'json': options.contentType = self.self.mime.json; break;
				case 'xml': options.contentType = self.mime.xm; break;
				case 'html': options.contentType = self.mime.html; break;
				case 'text': options.contentType = self.mime.text; break;
				default: options.contentType = self.mime.urlencoded;
			}

			switch (options.responseType) {
				case 'script': options.accept = self.mime.script; break;
				case 'json': options.accept = self.mime.json; break;
				case 'xml': options.accept = self.mime.xml; break;
				case 'html': options.accept = self.mime.html; break;
				case 'text': options.accept = self.mime.text; break;
			}

			if (options.contentType === self.mime.json) options.data = JSON.stringify(options.data);
			if (options.contentType === self.mime.urlencoded) options.data = self.serialize(options.data);
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
};

Http.prototype.create = function () {
	var self = this;

	return self;
};

module.exports = function () {
	return new Http().create();
};

},{}],9:[function(require,module,exports){
/*
	@preserve
	name: jenie
	version: 1.0.7
	author: alexander elias
*/

var Component = require('./component');
var Global = require('./global');
var Binder = require('./binder');
var Router = require('./router');
var Http = require('./http');

var S_VIEW_ELEMENT = Global.sViewElement;

document.registerElement(S_VIEW_ELEMENT, {
	prototype: Object.create(HTMLElement.prototype)
});

module.exports = {
	services: {},
	http: Http(),
	component: function (options) {
		return Component(options);
	},
	binder: function (options, callback) {
		return Binder(options, callback);
	},
	router: function (options) {
		return this.router = Router(options);
	},
	query: function (query) {
		return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
	},
	script: function () {
		return (document._currentScript || document.currentScript);
	},
	document: function () {
		return (document._currentScript || document.currentScript).ownerDocument;
	}
};

},{"./binder":1,"./component":6,"./global":7,"./http":8,"./router":10}],10:[function(require,module,exports){
var Utility = require('./utility');

function Router () {}

Router.prototype.render = function (route) {
	var self = this;
	var component = null;

	if (route.title) document.title = route.title;

	if (typeof route.component === 'string') {
		if (route.component in self.cache) component = self.cache[route.component];
		else component = self.cache[route.component] = document.createElement(route.component);
	} else {
		component = route.component;
	}

	if (self.view.firstChild) self.view.removeChild(self.view.firstChild);
	self.view.appendChild(component);
	window.scroll(0, 0);
	return self;
};

Router.prototype.redirect = function (route) {
	var self = this;
	window.location = route.path;
	return self;
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
};

Router.prototype.change = function (state, replace) {
	var self = this;

	if (self.mode) {
		window.history[replace ? 'replaceState' : 'pushState'](state, state.title, Utility.normalize(state.origin + state.path));
	} else {
		self.isChangeEvent = false;
		window.location = Utility.normalize(state.origin + state.path);
	}

	return self;
};

Router.prototype.navigate = function (state, replace) {
	var self = this;

	self.state.path = Utility.getPath(state.path, self.state.base, self.state.root);
	self.state.hash = Utility.getHash(self.state.path);
	self.state.search = Utility.getSearch(self.state.path);
	self.state.href = Utility.normalize(window.location.href);

	self.route = self.get(self.state.path);
	self.state.title = self.route.title;

	self.change(self.state, replace);

	if (self.route.redirect) {
		self.redirect(self.route);
	} else {
		self.render(self.route);
	}

	return self;
};

Router.prototype.create = function (options) {
	var self = this;

	self.mode = options.mode;
	self.mode = self.mode === null || self.mode === undefined ? true : self.mode;
	self.mode = 'history' in window && 'pushState' in window.history ? self.mode : false;

	self.base = options.base || '';
	self.routes = options.routes || [];
	self.external = options.external || '';

	self.cache = {};
	self.isChangeEvent = true;
	self.root = self.mode ? '/' : '/#';
	self.state = { root: self.root, base: self.base, origin: Utility.normalize(self.base + self.root) };

	window.addEventListener('DOMContentLoaded', function () {
		self.view = document.querySelector('j-view') || document.querySelector('[j-view]');
		self.navigate({ path: window.location.href }, true);
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

		// if external is true then default action
		if (self.external) {
			if (self.external.constructor.name === 'Function' && self.external(target.href)) return;
			else if (self.external.constructor.name === 'RegExp' && self.external.test(target.href)) return;
			else if (self.external.constructor.name === 'String' && new RegExp(self.external).test(target.href)) return;
		}

		// check non acceptable attributes
		if (target.hasAttribute('download') || target.getAttribute('rel') === 'external') return;

		// check non acceptable href
		if (Utility.has(target.href, 'mailto:')) return;
		if (Utility.has(target.href, 'tel:')) return;
		if (Utility.has(target.href, 'file:')) return;
		if (Utility.has(target.href, 'ftp:')) return;

		// check non acceptable origin
		// if (!Utility.isSameOrigin(state.path)) return;

		e.preventDefault();
		// if (!Utility.isSamePath(target.href, self.state.path))
		self.navigate({ path: target.href });
	}, false);

	return self;
};

module.exports = function (options) {
	return new Router().create(options);
};

},{"./utility":11}],11:[function(require,module,exports){

module.exports = {
	has: function (string, search) {
		return string.indexOf(search) !== -1;
	},
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

},{}]},{},[9])(9)
});