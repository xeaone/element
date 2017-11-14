import Global from './global';

var Fetcher = {};

Fetcher.mime = {
	xml: 'text/xml; charset=utf-8',
	html: 'text/html; charset=utf-8',
	text: 'text/plain; charset=utf-8',
	json: 'application/json; charset=utf-8',
	js: 'application/javascript; charset=utf-8'
};

Fetcher.setup = function (opt) {
	opt = opt || {};
	this.auth = opt.auth || false;
	this.type = opt.type || 'text';
	this.request = opt.request || opt.request;
	this.response = opt.response || opt.response;
	return this;
};

Fetcher.serialize = function (data) {
	var string = '';

	for (var name in data) {
		string = string.length > 0 ? string + '&' : string;
		string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
	}

	return string;
};

Fetcher.onreadystatechange = function (opt, result, xhr) {
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
			if (this.auth || result.opt.auth) {
				if (Global.keeper.response) {
					return Global.keeper.response(result);
				}
			}
		}

		if (this.response && this.response(result) === false) {
			return;
		}

		if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
			opt.isError = false;
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

Fetcher.fetch = function (opt) {
	var result = {};
	var xhr = new XMLHttpRequest();

	opt = opt || {};
	opt.headers = {};
	opt.error = false;
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
			case 'js': opt.headers['Content-Type'] = this.mime.js; break;
			case 'xml': opt.headers['Content-Type'] = this.mime.xm; break;
			case 'html': opt.headers['Content-Type'] = this.mime.html; break;
			case 'json': opt.headers['Content-Type'] = this.mime.json; break;
			default: opt.headers['Content-Type'] = this.mime.text;
		}
	}

	if (opt.acceptType) {
		switch (opt.acceptType) {
			case 'js': opt.headers['Accept'] = this.mime.js; break;
			case 'xml': opt.headers['Accept'] = this.mime.xml; break;
			case 'html': opt.headers['Accept'] = this.mime.html; break;
			case 'json': opt.headers['Accept'] = this.mime.json; break;
			default: opt.headers['Accept'] = this.mime.text;
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
		opt.url = opt.url + '?' + this.serialize(opt.data);
	}

	result.xhr = xhr;
	result.opt = opt;
	result.data = opt.data;

	if (this.auth && (
		result.opt.auth === true ||
		result.opt.auth === undefined
	)) {
		if (Global.keeper.request(result) === false) {
			return;
		}
	}

	if (this.request && this.request(result) === false) {
		return;
	}

	xhr.onreadystatechange = this.onreadystatechange.bind(this, opt, result, xhr);

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
