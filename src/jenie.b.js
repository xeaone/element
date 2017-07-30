
/*
	@banner
	name: jenie
	version: 1.3.5
	license: mpl-2.0
	author: alexander elias

	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Component from './component';
import Binder from './binder';
import Router from './router';
import Module from './module';
import Http from './http';

function Jenie () {
	var sStyle = 'j-view, j-view > :first-child { display: block; }';
	var eStyle = document.createElement('style');
	var nStyle = document.createTextNode(sStyle);

	eStyle.appendChild(nStyle);
	document.head.appendChild(eStyle);

	this.services = {};

	this.http = new Http();
	this.module = new Module();
	this.router = new Router();

	this.setup = function (data, callback) {
		var self = this;

		if (data.module) {
			data.module.forEach(function (parameters) {
				self.module.export.apply(self, parameters);
			});
		}

		self.router.listen(data.router, function () {
			if (callback) return callback();
		});
	};

	this.component = function (options) {
		return new Component(options);
	};

	this.binder = function (options, callback) {
		return new Binder(options, callback);
	};

	this.script = function () {
		return (document._currentScript || document.currentScript);
	};

	this.document = function () {
		return (document._currentScript || document.currentScript).ownerDocument;
	};

	this.element = function (name) {
		return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
	};

	this.query = function (query) {
		return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
	};

}

export default new Jenie();
