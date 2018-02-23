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

const Global = {
	compiled: false
};

Object.defineProperties(Global, {
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
	global: {
		enumerable: true,
		value: {}
	},
	methods: {
		enumerable: true,
		value: {
			data: {}
		}
	},
	utility: {
		enumerable: true,
		value: Utility
	},
	setup: {
		enumerable: true,
		value: function (options) {

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
			}

			if (options.component) {
				this.component.setup(options.component);
			}

			if (options.router) {
				this.router.setup(options.router);
			}

		}
	}
});

Object.defineProperty(Global, 'batcher', {
	enumerable: true,
	value: new Batcher()
});

Object.defineProperty(Global, 'loader', {
	enumerable: true,
	value: new Loader()
});

Object.defineProperty(Global, 'binder', {
	enumerable: true,
	value: new Binder()
});

Object.defineProperty(Global, 'fetcher', {
	enumerable: true,
	value: new Fetcher()
});

Object.defineProperty(Global, 'keeper', {
	enumerable: true,
	value: new Keeper()
});

Object.defineProperty(Global, 'component', {
	enumerable: true,
	value: new Component()
});

Object.defineProperty(Global, 'router', {
	enumerable: true,
	value: new Router()
});

Object.defineProperty(Global, 'model', {
	enumerable: true,
	value: new Model()
});

Object.defineProperty(Global, 'view', {
	enumerable: true,
	value: new View()
});

export default Global;
