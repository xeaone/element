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

		const request = {};
		const response = {};

		data.headers = data.headers || this.headers;
		data.forbidden = data.forbidden || this.forbidden;
		data.unauthorized = data.unauthorized || this.unauthorized;

		data.acceptType = data.acceptType || this.acceptType;
		data.contentType = data.contentType || this.contentType;
		data.responseType = data.responseType || this.responseType;

		data.method = (data.method || this.method).toUpperCase();

		request.method = data.method;
		request.headers = data.headers;

		if (data.contentType) {
			switch (data.contentType) {
				case 'js': request.headers['Content-Type'] = this.mime.js; break;
				case 'xml': request.headers['Content-Type'] = this.mime.xml; break;
				case 'html': request.headers['Content-Type'] = this.mime.html; break;
				case 'json': request.headers['Content-Type'] = this.mime.json; break;
				default: request.headers['Content-Type'] = this.contentType;
			}
		}

		if (data.acceptType) {
			switch (data.acceptType) {
				case 'js': request.headers['Accept'] = this.mime.js; break;
				case 'xml': request.headers['Accept'] = this.mime.xml; break;
				case 'html': request.headers['Accept'] = this.mime.html; break;
				case 'json': request.headers['Accept'] = this.mime.json; break;
				default: request.headers['Accept'] = this.acceptType;
			}
		}

		// if (opt.mimeType) {
			// opt.xhr.overrideMimeType(opt.mimeType);
		// }

		// if (opt.withCredentials) {
			// opt.xhr.withCredentials = opt.withCredentials;
		// }

		if (data.body) {

			if (data.method === 'GET') {
				data.url = data.url + '?' + await this.serialize(data.body);
				request.url = data.url;
			} else if (data.contentType === 'json') {
				data.body = JSON.stringify(data.body);
				request.body = data.body;
			}

		}

		if (typeof this.request === 'function') {
			const copy = Object.assign({}, request);
			const result = await this.request(copy);

			if (result === false) {
				return request;
			}

			if (typeof result === 'object') {
				Object.assign(request, result);
			}

		}

		const fetched = await window.fetch(request.url, request);

		response.code = fetched.status;
		response.message = fetched.statusText;

		switch (data.responseType) {
			case 'text': response.body = fetched.text(); break;
			case 'json': response.body = fetched.json(); break;
			case 'blob': response.body = fetched.blob(); break;
			case 'buffer': response.body = fetched.arrayBuffer(); break;
			default: response.body = fetched.body;
		}

		if (response.code === 401 || response.code === 403) {
			const method = response.code === 401 ? 'unauthorized' : 'forbidden';

			if (typeof data[method] === 'string') {
				Router.route(data[method]);
			}

			if (typeof data[method] === 'function') {
				await data[method](response);
			}

			return response;
		}

		if (this.response) {
			const copy = Object.assign({}, response);
			const result = await this.response(copy);

			if (result === false) {
				return response;
			}

			if (typeof result === 'object') {
				Object.assign(response, result);
			}

		}

		return response;
	}

	post (opt) {
		opt.method = 'post';
		return this.fetch(opt);
	}

	get (opt) {
		opt.method = 'get';
		return this.fetch(opt);
	}

	put (opt) {
		opt.method = 'put';
		return this.fetch(opt);
	}

	head (opt) {
		opt.method = 'head';
		return this.fetch(opt);
	}

	patch (opt) {
		opt.method = 'patch';
		return this.fetch(opt);
	}

	delete (opt) {
		opt.method = 'delete';
		return this.fetch(opt);
	}

	options (opt) {
		opt.method = 'options';
		return this.fetch(opt);
	}

	connect (opt) {
		opt.method = 'connect';
		return this.fetch(opt);
	}

}
