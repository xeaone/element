import Global from './global.js';
import Router from './router.js';
import Wraper from './wraper.js';

export default class Fetcher

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

	change (opt) {
		var self = this;

		if (opt.xhr.readyState === 4) {

			opt.code = opt.xhr.status;
			opt.message = opt.xhr.statusText;

			if (opt.xhr['response'] !== undefined) {
				opt.data = opt.xhr.response;
			} else if (opt.xhr['responseText'] !== undefined) {
				opt.data = opt.xhr.responseText;
			}

			// NOTE this is added for IE10-11 support http://caniuse.com/#search=xhr2
			if (opt.responseType === 'json' && typeof opt.data === 'string') {

				try {
					opt.data = JSON.parse(opt.data);
				} catch (error) {
					console.warn(error);
				}

			}

			if (opt.xhr.status === 401 || opt.xhr.status === 403) {
				if (opt.auth) {
					if (Global.keeper.response && Global.keeper.response(opt) === false) {
						return;
					}
				}
			}

			var end = function () {
				if (opt.xhr.status >= 200 && opt.xhr.status < 300 || opt.xhr.status == 304) {

					if (opt.success) {
						opt.success(opt);
					} else if (opt.handler) {
						opt.error = false;
						opt.handler(opt);
					}

				} else {

					if (opt.error) {
						opt.error(opt);
					} else if (opt.handler) {
						opt.error = true;
						opt.handler(opt);
					}

				}
			};

			if (self.response) {
				Wraper(self.response.bind(null, opt), function (result) {
					if (result !== false) {
						end();
					}
				});
			} else {
				end();
			}

		}
	}

	async fetch (data) {
		data = Object.assign({}, data || {});

		if (!data.url) throw new Error('Oxe.fetcher - requires url option');

		// const result = {};
		const request = {};
		const response = {};

		data.headers = data.headers || this.headers;
		data.forbidden = data.forbidden || this.forbidden;
		data.unauthorized = data.unauthorized || this.unauthorized;
		data.method = (data.method || this.method).toUpperCase();

		// request.body = data.body;
		// request.method = data.method;
		// request.headers = data.headers;

		switch (data.contentType) {
			case 'js': request.headers['Content-Type'] = this.mime.js; break;
			case 'xml': request.headers['Content-Type'] = this.mime.xml; break;
			case 'html': request.headers['Content-Type'] = this.mime.html; break;
			case 'json': request.headers['Content-Type'] = this.mime.json; break;
			default: request.headers['Content-Type'] = this.contentType;
		}

		switch (data.acceptType) {
			case 'js': request.headers['Accept'] = this.mime.js; break;
			case 'xml': request.headers['Accept'] = this.mime.xml; break;
			case 'html': request.headers['Accept'] = this.mime.html; break;
			case 'json': request.headers['Accept'] = this.mime.json; break;
			default: request.headers['Accept'] = this.acceptType;
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
		
		if (response.code >= 200 && result.code < 300 || result.code == 304) {
			result.error = false;
		} else {
			result.error = true;
		}

		if (this.response) {
			const end = await this.response(result);
			if (end === false) return;
		}

		return result;
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
