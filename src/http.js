
export default function Http (opt) {
	this.setup(opt);
}

Http.prototype.setup = function (opt) {
	opt = opt || {};
	this.request = opt.request === undefined ? this.request : opt.request;
	this.response = opt.response === undefined ? this.response : opt.response;
	return this;
};

Http.prototype.mime = {
	html: 'text/html',
	text: 'text/plain',
	xml: 'application/xml, text/xml',
	json: 'application/json, text/javascript',
	urlencoded: 'application/x-www-form-urlencoded',
	script: 'text/javascript, application/javascript, application/x-javascript'
};

Http.prototype.serialize = function (data) {
	var string = '';

	for (var name in data) {
		string = string.length > 0 ? string + '&' : string;
		string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
	}

	return string;
};

Http.prototype.fetch = function (opt) {
	var self = this;
	var xhr = new XMLHttpRequest();

	opt = opt || {};
	opt.headers = {};
	opt.url = opt.url ? opt.url : window.location.href;
	opt.method = opt.method ? opt.method.toUpperCase() : 'GET';

	if (opt.contentType) {
		switch (opt.contentType) {
			case 'xml': opt.contentType = self.mime.xm; break;
			case 'html': opt.contentType = self.mime.html; break;
			case 'text': opt.contentType = self.mime.text; break;
			case 'json': opt.contentType = self.mime.json; break;
			case 'script': opt.contentType = self.mime.script; break;
		}
	}

	if (opt.acceptType) {
		switch (opt.acceptType) {
			case 'xml': opt.acceptType = self.mime.xml; break;
			case 'html': opt.acceptType = self.mime.html; break;
			case 'text': opt.acceptType = self.mime.text; break;
			case 'json': opt.acceptType = self.mime.json; break;
			case 'script': opt.acceptType = self.mime.script; break;
		}
	}

	if (opt.data) {
		if (opt.method === 'GET') {
			opt.data = self.serialize(opt.data);
			opt.url = opt.url + '?' + opt.data;
		}
		else if (!opt.contentType) opt.contentType = self.mime.urlencoded;
		else if (opt.contentType === self.mime.json) opt.data = JSON.stringify(opt.data);
		else if (opt.contentType === self.mime.urlencoded) opt.data = self.serialize(opt.data);
	}

	if (opt.mimeType) xhr.overrideMimeType(opt.mimeType);
	if (opt.responseType) xhr.responseType = opt.responseType;
	if (opt.withCredentials) xhr.withCredentials = opt.withCredentials;

	if (opt.acceptType) opt.headers['Accept'] = opt.acceptType;
	if (opt.contentType) opt.headers['Content-Type'] = opt.contentType;

	if (opt.headers) {
		for (var name in opt.headers) {
			xhr.setRequestHeader(name, opt.headers[name]);
		}
	}

	var requestResult = self.request ? self.request({ data: opt.data, opt: opt, xhr: xhr }) : undefined;
	if (requestResult === undefined || requestResult === true) {

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				var result = {
					opt: opt,
					xhr: xhr,
					statusCode: xhr.status,
					statusText: xhr.statusText,
					data: xhr.response || xhr.responseText
				};

				// NOTE support for IE10-11 http://caniuse.com/#search=xhr2
				if (opt.responseType === 'json' && typeof result.data !== 'object') {
					result.data = JSON.parse(xhr.responseText);
				}

				var responseResult = self.response ? self.response(result) : undefined;
				if (responseResult === undefined || responseResult === true) {
					if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
						if (opt.success) {
							return opt.success(result);
						}
					} else {
						if (opt.error) {
							return opt.error(result);
						}
					}
				}
			}
		};

		xhr.open(opt.method, opt.url, true, opt.username, opt.password);
		xhr.send(opt.method === 'GET' ? null : opt.data);
	}

};
