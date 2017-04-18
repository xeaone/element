var Binder = require('../binder');
var Http = require('../http');
var Uuid = require('../uuid');

var isUrl = new RegExp('^http|^\\/|^\\.\\/', 'i');
// var isHtml = new RegExp('<|>', 'i');

function getTemplateUrl (path, callback) {
	Http.fetch({
		action: path,
		success: function (result) {
			return callback(result.response);
		},
		error: function (result) {
			throw new Error('getTemplateUrl: ' + result.status + ' ' + result.statusText);
		}
	});

	// var xhr = new XMLHttpRequest();
	//
	// xhr.open('GET', path, true);
	// xhr.onreadystatechange = onreadystatechange;
	// xhr.send();
	//
	// function onreadystatechange () {
	// 	if (xhr.readyState === xhr.DONE && xhr.status === 200) return callback(xhr.response);
	// 	else if (xhr.readyState === xhr.DONE && xhr.status !== 200) throw new Error('getTemplateUrl: ' + xhr.status + ' ' + xhr.statusText);
	// }
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
	if (!options.tag) throw new Error('Component: missing tag');

	var component = {};

	component.template = options.template;

	if (!component.template) {
		component.template = document.currentScript ? document.currentScript.ownerDocument.querySelector('template') : document._currentScript.ownerDocument.querySelector('template');
	} else if (component.template.constructor.name === 'Function') {
		component.template = toDom(component.template);
	} else if (component.template.constructor.name === 'String') {
		if (isUrl.test(component.template)) {
			component.isUrl = true;
		} else {
			component.isUrl = false;
			component.template = toDom(component.template);
		}
	} else {
		component.template = options.template;
	}

	component.created = options.created;
	component.attached = options.attached;
	component.detached = options.detached;
	component.attributed = options.attributed;

	component.isCreated = false;
	component.tag = options.tag;
	component.model = options.model;
	component.extends = options.extends;
	component.controller = options.controller;
	component.proto = Object.create(options.proto || HTMLElement.prototype);

	if (component.attached) component.proto.attachedCallback = component.attached.bind(component);
	if (component.detached) component.proto.detachedCallback = component.detached.bind(component);
	if (component.attributed) component.proto.attributeChangedCallback = component.attributed.bind(component);

	component.proto.createdCallback = function () {
		component.element = this;

		function create () {
			if (!component.element.id) {
				component.element.id = Uuid();
			}

			component.element.innerHTML = '';
			component.element.appendChild(document.importNode(component.template.content, true));
			Binder.controller({ name: component.element.id, scope: component.element,  model: component.model }, component.controller);
			if (component.created) component.created.call(component);
		}

		if (component.isUrl) {
			getTemplateUrl(options.template, function (data) {
				component.template = toDom(data);
				create();
			});
		} else {
			create();
		}
	};

	document.registerElement(component.tag, {
		prototype: component.proto,
		extends: component.extends
	});

};
