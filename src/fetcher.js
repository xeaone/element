import Keeper from './keeper';

var Fetcher = {};

Fetcher.setup = function (opt) {
	opt = opt || {};
	this.auth = opt.auth || false;
	this.type = opt.type || 'text';
	this.request = opt.request || opt.request;
	this.response = opt.response || opt.response;
	return this;
};

Fetcher.mime = {
	xml: 'text/xml; charset=utf-8',
	html: 'text/html; charset=utf-8',
	text: 'text/plain; charset=utf-8',
	json: 'application/json; charset=utf-8',
	js: 'application/javascript; charset=utf-8'
};

Fetcher.serialize = function (data) {
	var string = '';

	for (var name in data) {
		string = string.length > 0 ? string + '&' : string;
		string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
	}

	return string;
};

// Fetcher.onreadystatechange = function () { };

Fetcher.fetch = function (opt) {
	var self = this;
	var result = {};
	var xhr = new XMLHttpRequest();

	opt = opt || {};
	opt.headers = {};
	opt.error = false;
	opt.type = opt.type || this.type;
	opt.url = opt.url ? opt.url : window.location.href;
	opt.method = opt.method ? opt.method.toUpperCase() : 'GET';

	xhr.open(opt.method, opt.url, true, opt.username, opt.password);

	if (opt.type) {
		opt.acceptType = opt.acceptType || opt.type;
		opt.contentType = opt.contentType || opt.type;
		opt.responseType = opt.responseType || opt.type;
	}

	if (opt.contentType) {
		switch (opt.contentType) {
			case 'js': opt.headers['Content-Type'] = self.mime.js; break;
			case 'xml': opt.headers['Content-Type'] = self.mime.xm; break;
			case 'html': opt.headers['Content-Type'] = self.mime.html; break;
			case 'json': opt.headers['Content-Type'] = self.mime.json; break;
			default: opt.headers['Content-Type'] = self.mime.text;
		}
	}

	if (opt.acceptType) {
		switch (opt.acceptType) {
			case 'js': opt.headers['Accept'] = self.mime.js; break;
			case 'xml': opt.headers['Accept'] = self.mime.xml; break;
			case 'html': opt.headers['Accept'] = self.mime.html; break;
			case 'json': opt.headers['Accept'] = self.mime.json; break;
			default: opt.headers['Accept'] = self.mime.text;
		}
	}

	if (opt.responseType) {
		switch (opt.responseType) {
			case 'json': xhr.responseType = 'json'; break;
			case 'blob': xhr.responseType = 'blob'; break;
			case 'xml': xhr.responseType = 'document'; break;
			case 'html': xhr.responseType = 'document'; break;
			case 'document': xhr.responseType = 'document'; break;
			case 'arraybuffer': xhr.responseType = 'arraybuffer'; break;
			default: xhr.responseType = 'text';
		}
	}

	if (opt.mimeType) {
		xhr.overrideMimeType(opt.mimeType);
	}

	if (opt.withCredentials) {
		xhr.withCredentials = opt.withCredentials;
	}

	if (opt.cache) {
		opt.headers.cache = true;
	} else {
		opt.cache = false;
	}

	if (opt.headers) {
		for (var name in opt.headers) {
			xhr.setRequestHeader(name, opt.headers[name]);
		}
	}

	if (opt.data && opt.method === 'GET') {
		opt.url = opt.url + '?' + self.serialize(opt.data);
	}

	result.xhr = xhr;
	result.opt = opt;
	result.data = opt.data;

	if (self.auth && (
		result.opt.auth === true ||
		result.opt.auth === undefined
	)) {
		if (Keeper.request(result) === false) {
			return;
		}
	}

	if (self.request && self.request(result) === false) {
		return;
	}

	xhr.onreadystatechange = function () {
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
				result.data = JSON.parse(result.data || {});
			}

			if (xhr.status === 401 || xhr.status === 403) {
				if (self.auth || result.opt.auth) {
					if (Keeper.response) {
						return Keeper.response(result);
					}
				}
			}

			if (self.response && self.response(result) === false) {
				return;
			}

			if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
				if (opt.success) {
					opt.success(result);
				} else if (opt.handler) {
					opt.handler(result);
				}
			} else {
				opt.isError = true;
				if (opt.error) {
					opt.error(result);
				} else if (opt.handler) {
					opt.handler(result);
				}
			}

		}
	};

	xhr.send(opt.method !== 'GET' && opt.contentType === 'json' ? JSON.stringify(opt.data || {}) : null);

};

Fetcher.post = function (opt) {
	opt.method = 'post';
	return Fetcher.fetch(opt);
};

Fetcher.get = function (opt) {
	opt.method = 'get';
	return Fetcher.fetch(opt);
};

Fetcher.put = function (opt) {
	opt.method = 'put';
	return Fetcher.fetch(opt);
};

Fetcher.head = function (opt) {
	opt.method = 'head';
	return Fetcher.fetch(opt);
};

Fetcher.patch = function (opt) {
	opt.method = 'patch';
	return Fetcher.fetch(opt);
};

Fetcher.delete = function (opt) {
	opt.method = 'delete';
	return Fetcher.fetch(opt);
};

Fetcher.options = function (opt) {
	opt.method = 'options';
	return Fetcher.fetch(opt);
};

Fetcher.connect = function (opt) {
	opt.method = 'connect';
	return Fetcher.fetch(opt);
};

export default Fetcher;
