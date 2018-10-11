import Component from './component.js';
import General from './general.js';
import Utility from './utility.js';
import Batcher from './batcher.js';
import Fetcher from './fetcher.js';
import Methods from './methods.js'
import Router from './router.js';
import Loader from './loader.js';
import Binder from './binder.js';
import Model from './model.js';

export default {

	compiled: false,

	get window () {
		return window;
	},

	get document () {
		return window.document;
	},

	get body () {
		return window.document.body;
	},

	get head () {
		return window.document.head;
	},

	get location () {
		return this.router.location;
	},

	get currentScript () {
		return (window.document._currentScript || window.document.currentScript);
	},

	get ownerDocument () {
		return (window.document._currentScript || window.document.currentScript).ownerDocument;
	},

	get global () {
		return {};
	},

	get methods () {
		return 	Methods;
	},

	get utility () {
		return Utility;
	},

	get general () {
		return General;
	},

	get batcher () {
		return Batcher;
	},

	get loader () {
		return Loader;
	},

	get binder () {
		return Binder;
	},

	get fetcher () {
		return Fetcher;
	},

	get component () {
		return Component;
	},

	get router () {
		return Router;
	},

	get model () {
		return Model;
	},

	setup (data) {

		if (this._setup) {
			return;
		} else {
			this._setup = true;
		}

		data = data || {};

		if (data.listener && data.listener.before) {
			data.listener.before();
		}

		if (data.general) {
			this.general.setup(data.general);
		}

		if (data.fetcher) {
			this.fetcher.setup(data.fetcher);
		}

		if (data.loader) {
			this.loader.setup(data.loader);
		}

		if (data.component) {
			this.component.setup(data.component);
		}

		if (data.router) {
			this.router.setup(data.router);
		}

		if (data.listener && data.listener.after) {
			data.listener.after();
		}

	}

}
