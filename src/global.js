import Component from './component';
import Utility from './utility';
import Batcher from './batcher';
import Fetcher from './fetcher';
import Router from './router';
import Loader from './loader';
import Binder from './binder';
import Keeper from './keeper';
import Model from './model';
import View from './view';

window.requestAnimationFrame = window.requestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| window.msRequestAnimationFrame
	|| function(c) { return setTimeout(c, 16); };

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
			return window.document;
		}
	},
	body: {
		enumerable: true,
		get: function () {
			return window.document.body;
		}
	},
	head: {
		enumerable: true,
		get: function () {
			return window.document.head;
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
			return (window.document._currentScript || window.document.currentScript);
		}
	},
	ownerDocument: {
		enumerable: true,
		get: function () {
			return (window.document._currentScript || window.document.currentScript).ownerDocument;
		}
	},
	// requestAnimationFrame: {
	// 	enumerable: true,
	// 	value: window.requestAnimationFrame
	// 		|| window.webkitRequestAnimationFrame
	// 		|| window.mozRequestAnimationFrame
	// 		|| window.msRequestAnimationFrame
	// 		|| function(c) { return setTimeout(c, 16); }
	// },
	// clicks: {
	// 	enumerable: true,
	// 	value: []
	// },
	// popstates: {
	// 	enumerable: true,
	// 	value: []
	// },
	global: {
		enumerable: true,
		value: {}
	},
	events: {
		enumerable: true,
		value: {
			data: {}
		}
	},
	modifiers: {
		enumerable: true,
		value: {
			data: {}
		}
	},
	view: {
		enumerable: true,
		value: View
	},
	model: {
		enumerable: true,
		value: Model
	},
	utility: {
		enumerable: true,
		value: Utility
	},
	binder: {
		enumerable: true,
		value: new Binder()
	},
	keeper:{
		enumerable: true,
		value: new Keeper()
	},
	loader:{
		enumerable: true,
		value: new Loader()
	},
	router:{
		enumerable: true,
		value: new Router()
	},
	batcher:{
		enumerable: true,
		value: new Batcher()
	},
	fetcher:{
		enumerable: true,
		value: new Fetcher()
	},
	component:{
		enumerable: true,
		value: new Component()
	},
	setup: {
		enumerable: true,
		value: function setup (options) {

			if (this.isSetup) {
				return;
			} else {
				this.isSetup = true;
			}

			options = options || {};

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
				this.router.setup(options.router);
				this.router.run();
			}

		}
	}
});

export default Global;
