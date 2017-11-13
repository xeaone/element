import Component from './component';
import Batcher from './batcher';
import Fetcher from './fetcher';
import Router from './router';
import Loader from './loader';
import Keeper from './keeper';
import Model from './model';
import View from './view';

var base = document.head.querySelector('base');

var Global = Object.defineProperties({}, {
	window: {
		enumerable: true,
		get: function () {
			return window;
		}
	},
	document: {
		enumerable: true,
		get: function () {
			return document;
		}
	},
	body: {
		enumerable: true,
		get: function () {
			return document.body;
		}
	},
	head: {
		enumerable: true,
		get: function () {
			return document.head;
		}
	},
	location: {
		enumerable: true,
		get: function () {
			return this.router.location;
		}
	},
	currentScript: {
		enumerable: true,
		get: function () {
			return (document._currentScript || document.currentScript);
		}
	},
	ownerDocument: {
		enumerable: true,
		get: function () {
			return (document._currentScript || document.currentScript).ownerDocument;
		}
	},
	base: {
		enumerable: true,
		get: function () {
			return (base ? base.href : '') || window.location.href
		}
	},
	global: {
		enumerable: true,
		value: {}
	},
	clicks: {
		enumerable: true,
		value: []
	},
	inputs: {
		enumerable: true,
		value: []
	},
	changes: {
		enumerable: true,
		value: []
	},
	popstates: {
		enumerable: true,
		value: []
	},
	mutations: {
		enumerable: true,
		value: []
	},
	events: {
		enumerable: true,
		value: { data: {} }
	},
	modifiers: {
		enumerable: true,
		value: { data: {} }
	},
	view: {
		enumerable: true,
		value: View
	},
	model: {
		enumerable: true,
		value: Model
	},
	keeper:{
		enumerable: true,
		value: Keeper
	},
	loader:{
		enumerable: true,
		value: Loader
	},
	router:{
		enumerable: true,
		value: Router
	},
	batcher:{
		enumerable: true,
		value: Batcher
	},
	fetcher:{
		enumerable: true,
		value: Fetcher
	},
	component:{
		enumerable: true,
		value: Component
	},
	setup: {
		enumerable: true,
		value: function (options) {

			if (this.isSetup) {
				return;
			} else {
				this.isSetup = true;
			}

			options = (typeof options === 'function' ? options.call(Oxe) : options) || {};

			if (options.keeper) {
				this.keeper.setup(options.keeper);
			}

			if (options.fetcher) {
				this.fetcher.setup(options.fetcher);
			}

			if (options.loader) {
				this.loader.setup(options.loader);
				this.loader.run();
			}

			if (options.router) {
				this.clicks.push(this.router.click.bind(this.router));
				this.popstates.push(this.router.popstate.bind(this.router));
				this.router.setup(options.router);
				this.router.run();
			}

		}
	}
});

export default Global;
