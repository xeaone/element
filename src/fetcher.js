import Global from './global.js';
import Router from './router.js';
import Wraper from './wraper.js';

export default class Fetcher {

	constructor (options) {

		this.mime = {
			xml: 'text/xml; charset=utf-8',
			html: 'text/html; charset=utf-8',
			text: 'text/plain; charset=utf-8',
			json: 'application/json; charset=utf-8',
			js: 'application/javascript; charset=utf-8'
		};

		this.setup(options);
	}

	setup (options) {
		options = options || {};

		this.headers = options.headers || {};
		this.method = options.method || 'get';

		this.forbidden = options.forbidden;
		this.unauthorized = options.unauthorized;

		this.request = options.request;
		this.response = options.response;
		this.acceptType = options.acceptType;
		this.contentType = options.contentType;
		this.responseType = options.responseType;
	}

	async serialize (data) {
		let query = '';

		for (let name in data) {
			query = query.length > 0 ? query + '&' : query;
			query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return query;
	}

	async fetch (options) {
		const data = Object.assign({}, options);

		if (!data.url) throw new Error('Oxe.fetcher - requires url option');

		data.method = (data.method || this.method).toUpperCase();

		data.headers = data.headers || this.headers;
		data.forbidden = data.forbidden || this.forbidden;
		data.unauthorized = data.unauthorized || this.unauthorized;

		data.acceptType = data.acceptType || this.acceptType;
		data.contentType = data.contentType || this.contentType;
		data.responseType = data.responseType || this.responseType;

		// omit, same-origin, or include
		data.credentials = data.credentials || this.credentials;

		// cors, no-cors, or same-origin
		data.mode = data.mode || this.mode;

		// default, no-store, reload, no-cache, force-cache, or only-if-cached
		data.cahce = data.cache || this.cache;

		// follow, error, or manual
		data.redirect = data.redirect || this.redirect;

		// no-referrer, client, or a URL
		data.referrer = data.referrer || this.referrer;

		// no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, unsafe-url
		data.referrerPolicy = data.referrerPolicy || this.referrerPolicy;

		data.signal = data.signal || this.signal;
		data.integrity = data.integrity || this.integrity;
		data.keepAlive = data.keepAlive || this.keepAlive;

		if (data.contentType) {
			switch (data.contentType) {
				case 'js': data.headers['Content-Type'] = this.mime.js; break;
				case 'xml': data.headers['Content-Type'] = this.mime.xml; break;
				case 'html': data.headers['Content-Type'] = this.mime.html; break;
				case 'json': data.headers['Content-Type'] = this.mime.json; break;
				default: data.headers['Content-Type'] = this.contentType;
			}
		}

		if (data.acceptType) {
			switch (data.acceptType) {
				case 'js': data.headers['Accept'] = this.mime.js; break;
				case 'xml': data.headers['Accept'] = this.mime.xml; break;
				case 'html': data.headers['Accept'] = this.mime.html; break;
				case 'json': data.headers['Accept'] = this.mime.json; break;
				default: data.headers['Accept'] = this.acceptType;
			}
		}

		if (data.body) {

			if (data.method === 'GET') {
				data.url = data.url + '?' + await this.serialize(data.body);
			} else if (data.contentType === 'json') {
				data.body = JSON.stringify(data.body);
			}

		}

		if (typeof this.request === 'function') {
			const copy = Object.assign({}, data);
			const result = await this.request(copy);

			if (result === false) {
				return data;
			}

			if (typeof result === 'object') {
				Object.assign(data, result);
			}

		}

		const fetched = await window.fetch(data.url, data);

		data.code = fetched.status;
		data.message = fetched.statusText;

		switch (data.responseType) {
			case 'text': data.body = fetched.text(); break;
			case 'json': data.body = fetched.json(); break;
			case 'blob': data.body = fetched.blob(); break;
			case 'buffer': data.body = fetched.arrayBuffer(); break;
			default: data.body = fetched.body;
		}

		if (data.code === 401 || data.code === 403) {
			const method = data.code === 401 ? 'unauthorized' : 'forbidden';

			if (typeof data[method] === 'string') {
				Router.route(data[method]);
			}

			return data;
		}

		if (this.response) {
			const copy = Object.assign({}, data);
			const result = await this.response(copy);

			if (result === false) {
				return data;
			}

			if (typeof result === 'object') {
				Object.assign(data, result);
			}

		}

		return data;
	}

	async post (data) {
		data.method = 'post';
		return this.fetch(data);
	}

	async get (data) {
		data.method = 'get';
		return this.fetch(data);
	}

	async put (data) {
		data.method = 'put';
		return this.fetch(data);
	}

	async head (data) {
		data.method = 'head';
		return this.fetch(data);
	}

	async patch (data) {
		data.method = 'patch';
		return this.fetch(data);
	}

	async delete (data) {
		data.method = 'delete';
		return this.fetch(data);
	}

	async options (data) {
		data.method = 'options';
		return this.fetch(data);
	}

	async connect (data) {
		data.method = 'connect';
		return this.fetch(data);
	}

}
