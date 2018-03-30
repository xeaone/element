import Global from './global.js';

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
		this.auth = options.auth || false;
		this.method = options.method || 'get';
		this.request = options.request;
		this.response = options.response;
		this.acceptType = options.acceptType;
		this.contentType = options.contentType;
		this.responseType = options.responseType;
	}

	serialize (data) {
		var string = '';

		for (var name in data) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return string;
	}

	change (opt, result, xhr) {
		if (xhr.readyState === 4) {

			result.opt = opt;
			result.xhr = xhr;
			result.statusCode = xhr.status;
			result.statusText = xhr.statusText;

			if (xhr['response'] !== undefined) {
				result.data = xhr.response;
			} else if (xhr['responseText'] !== undefined) {
				result.data = xhr.responseText;
			} else {
				result.data = undefined;
			}

			// NOTE this is added for IE10-11 support http://caniuse.com/#search=xhr2
			if (opt.responseType === 'json' && typeof result.data === 'string') {
				
				try {
					result.data = JSON.parse(result.data);
				} catch (error) {
					console.warn(error);
				}
				
			}

			if (xhr.status === 401 || xhr.status === 403) {

				if (result.opt.auth) {

					if (Global.keeper.response) {
						return Global.keeper.response(result);
					}

				}

			}

			if (this.response && this.response(result) === false) {
				return;
			}

			if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {

				if (opt.success) {
					opt.success(result);
				} else if (opt.handler) {
					opt.error = false;
					opt.handler(result);
				}

			} else {

				if (opt.error) {
					opt.error(result);
				} else if (opt.handler) {
					opt.error = true;
					opt.handler(result);
				}

			}

		}
	}

	fetch (opt) {
		var data;
		var result = {};
		var xhr = new XMLHttpRequest();

		opt = opt || {};

		opt.headers = {};
		opt.url = opt.url ? opt.url : window.location.href;
		opt.auth = opt.auth === undefined || opt.auth === null ? this.auth : opt.auth;
		opt.method = opt.method === undefined || opt.method === null ? this.method : opt.method;
		opt.acceptType = opt.acceptType === undefined || opt.acceptType === null ? this.acceptType : opt.acceptType;
		opt.contentType = opt.contentType === undefined || opt.contentType === null ? this.contentType : opt.contentType;
		opt.responseType = opt.responseType === undefined || opt.responseType === null ? this.responseType : opt.responseType;

		opt.method = opt.method.toUpperCase();

		xhr.open(opt.method, opt.url, true, opt.username, opt.password);

		if (opt.contentType) {
			switch (opt.contentType) {
				case 'js': opt.headers['Content-Type'] = this.mime.js; break;
				case 'xml': opt.headers['Content-Type'] = this.mime.xml; break;
				case 'html': opt.headers['Content-Type'] = this.mime.html; break;
				case 'json': opt.headers['Content-Type'] = this.mime.json; break;
				default: opt.headers['Content-Type'] = opt.contentType;
			}
		}

		if (opt.acceptType) {
			switch (opt.acceptType) {
				case 'js': opt.headers['Accept'] = this.mime.js; break;
				case 'xml': opt.headers['Accept'] = this.mime.xml; break;
				case 'html': opt.headers['Accept'] = this.mime.html; break;
				case 'json': opt.headers['Accept'] = this.mime.json; break;
				default: opt.headers['Accept'] = opt.acceptType;
			}
		}

		if (opt.responseType) {
			switch (opt.responseType) {
				case 'text': xhr.responseType = 'text'; break;
				case 'json': xhr.responseType = 'json'; break;
				case 'blob': xhr.responseType = 'blob'; break;
				case 'xml': xhr.responseType = 'document'; break;
				case 'html': xhr.responseType = 'document'; break;
				case 'document': xhr.responseType = 'document'; break;
				case 'arraybuffer': xhr.responseType = 'arraybuffer'; break;
				default: xhr.responseType = opt.responseType;
			}
		}

		if (opt.mimeType) {
			xhr.overrideMimeType(opt.mimeType);
		}

		if (opt.withCredentials) {
			xhr.withCredentials = opt.withCredentials;
		}

		if (opt.headers) {
			for (var name in opt.headers) {
				xhr.setRequestHeader(name, opt.headers[name]);
			}
		}

		if (opt.data) {
			if (opt.method === 'GET') {
				opt.url = opt.url + '?' + this.serialize(opt.data);
			} else if (opt.contentType === 'json') {
				data = JSON.stringify(opt.data);
			} else {
				data = opt.data;
			}
		}

		result.xhr = xhr;
		result.opt = opt;
		result.data = opt.data;

		if (result.opt.auth) {
			if (Global.keeper.request(result) === false) {
				return;
			}
		}

		if (this.request && this.request(result) === false) {
			return;
		}

		xhr.onreadystatechange = this.change.bind(this, opt, result, xhr);
		xhr.send(data);
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
