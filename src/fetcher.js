
export default {

	head: null,
	method: 'get',
	mime: {
		xml: 'text/xml; charset=utf-8',
		html: 'text/html; charset=utf-8',
		text: 'text/plain; charset=utf-8',
		json: 'application/json; charset=utf-8',
		js: 'application/javascript; charset=utf-8'
	},

	async setup (options) {
		options = options || {};
		this.head = options.head || this.head;
		this.method = options.method || this.method;
		this.path = options.path;
		this.origin = options.origin;
		this.request = options.request;
		this.response = options.response;
		this.acceptType = options.acceptType;
		this.credentials = options.credentials;
		this.contentType = options.contentType;
		this.responseType = options.responseType;
	},

	async serialize (data) {
		let query = '';

		for (let name in data) {
			query = query.length > 0 ? query + '&' : query;
			query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return query;
	},

	async fetch (options) {
		let data = Object.assign({}, options);

		data.path = data.path || this.path;
		data.origin = data.origin || this.origin;

		if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
		if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length-1) === '/') data.origin = data.origin.slice(0, -1);
		if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;

		if (!data.url) throw new Error('Oxe.fetcher - requires url or origin and path option');

		if (!data.method) throw new Error('Oxe.fetcher - requires method option');

		if (!data.head && this.head) data.head = this.head;
		if (typeof data.method === 'string') data.method = data.method.toUpperCase() || this.method;

		if (!data.acceptType && this.acceptType) data.acceptType = this.acceptType;
		if (!data.contentType && this.contentType) data.contentType = this.contentType;
		if (!data.responseType && this.responseType) data.responseType = this.responseType;

		// omit, same-origin, or include
		if (!data.credentials && this.credentials) data.credentials = this.credentials;

		// cors, no-cors, or same-origin
		if (!data.mode && this.mode) data.mode = this.mode;

		// default, no-store, reload, no-cache, force-cache, or only-if-cached
		if (!data.cache && this.cache) data.cahce = this.cache;

		// follow, error, or manual
		if (!data.redirect && this.redirect) data.redirect = this.redirect;

		// no-referrer, client, or a URL
		if (!data.referrer && this.referrer) data.referrer = this.referrer;

		// no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, unsafe-url
		if (!data.referrerPolicy && this.referrerPolicy) data.referrerPolicy = this.referrerPolicy;

		if (!data.signal && this.signal) data.signal = this.signal;
		if (!data.integrity && this.integrity) data.integrity = this.integrity;
		if (!data.keepAlive && this.keepAlive) data.keepAlive = this.keepAlive;

		if (data.contentType) {
			data.head = data.head || {};
			switch (data.contentType) {
				case 'js': data.head['Content-Type'] = this.mime.js; break;
				case 'xml': data.head['Content-Type'] = this.mime.xml; break;
				case 'html': data.head['Content-Type'] = this.mime.html; break;
				case 'json': data.head['Content-Type'] = this.mime.json; break;
				default: data.head['Content-Type'] = data.contentType;
			}
		}

		if (data.acceptType) {
			data.head = data.head || {};
			switch (data.acceptType) {
				case 'js': data.head['Accept'] = this.mime.js; break;
				case 'xml': data.head['Accept'] = this.mime.xml; break;
				case 'html': data.head['Accept'] = this.mime.html; break;
				case 'json': data.head['Accept'] = this.mime.json; break;
				default: data.head['Accept'] = data.acceptType;
			}
		}

		// IDEA for auth tokens
		// if (data.head) {
		// 	for (let name in data.head) {
		// 		if (typeof data.head[name] === 'function') {
		// 			data.head[name] = await data.head[name]();
		// 		}
		// 	}
		// }

		if (typeof this.request === 'function') {
			let copy = Object.assign({}, data);
			let result = await this.request(copy);

			if (result === false) {
				return data;
			}

			if (typeof result === 'object') {
				Object.assign(data, result);
			}

		}

		if (data.body) {

			if (data.method === 'GET') {
				data.url = data.url + '?' + await this.serialize(data.body);
			} else if (data.contentType === 'json') {
				data.body = JSON.stringify(data.body);
			}

		}

		let fetchOptions = Object.assign({}, data);

		if (fetchOptions.head) {
			fetchOptions.headers = fetchOptions.head;
			delete fetchOptions.head;
		}

		let fetched = await window.fetch(data.url, fetchOptions);

		data.code = fetched.status;
		data.message = fetched.statusText;

		if (!data.responseType) {
			data.body = fetched.body;
		} else {
			data.body = await fetched[
				data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType
			]();
		}

		if (this.response) {
			let copy = Object.assign({}, data);
			let result = await this.response(copy);

			if (result === false) {
				return data;
			}

			if (typeof result === 'object') {
				Object.assign(data, result);
			}

		}

		return data;
	},

	async post (data) {
		data = typeof data === 'string' ? { url: data } : data;
		data.method = 'post';
		return this.fetch(data);
	},

	async get (data) {
		data = typeof data === 'string' ? { url: data } : data;
		data.method = 'get';
		return this.fetch(data);
	},

	async put (data) {
		data = typeof data === 'string' ? { url: data } : data;
		data.method = 'put';
		return this.fetch(data);
	},

	async head (data) {
		data = typeof data === 'string' ? { url: data } : data;
		data.method = 'head';
		return this.fetch(data);
	},

	async patch (data) {
		data = typeof data === 'string' ? { url: data } : data;
		data.method = 'patch';
		return this.fetch(data);
	},

	async delete (data) {
		data = typeof data === 'string' ? { url: data } : data;
		data.method = 'delete';
		return this.fetch(data);
	},

	async options (data) {
		data = typeof data === 'string' ? { url: data } : data;
		data.method = 'options';
		return this.fetch(data);
	},

	async connect (data) {
		data = typeof data === 'string' ? { url: data } : data;
		data.method = 'connect';
		return this.fetch(data);
	}

};
