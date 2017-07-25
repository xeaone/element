
export default function Http () {}

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

Http.prototype.fetch = function (options) {
	var self = this;

	options = options ? options : {};
	options.action = options.action ? options.action : window.location.href;
	options.method = options.method ? options.method.toUpperCase() : 'GET';
	options.headers = options.headers ? options.headers : {};

	if (options.data) {

		if (options.method === 'GET') {

			options.action = options.action + '?' + self.serialize(options.data);
			options.data = null;

		} else {

			options.requestType = options.requestType ? options.requestType.toLowerCase() : '';
			options.responseType = options.responseType ? options.responseType.toLowerCase() : '';

			switch (options.requestType) {
				case 'script': options.contentType = self.mime.script; break;
				case 'json': options.contentType = self.self.mime.json; break;
				case 'xml': options.contentType = self.mime.xm; break;
				case 'html': options.contentType = self.mime.html; break;
				case 'text': options.contentType = self.mime.text; break;
				default: options.contentType = self.mime.urlencoded;
			}

			switch (options.responseType) {
				case 'script': options.accept = self.mime.script; break;
				case 'json': options.accept = self.mime.json; break;
				case 'xml': options.accept = self.mime.xml; break;
				case 'html': options.accept = self.mime.html; break;
				case 'text': options.accept = self.mime.text; break;
			}

			if (options.contentType === self.mime.json) {
				options.data = JSON.stringify(options.data);
			}

			if (options.contentType === self.mime.urlencoded) {
				options.data = self.serialize(options.data);
			}

		}

	}

	var xhr = new XMLHttpRequest();

	xhr.open(options.method, options.action, true, options.username, options.password);

	if (options.mimeType) {
		xhr.overrideMimeType(options.mimeType);
	}

	if (options.withCredentials) {
		xhr.withCredentials = options.withCredentials;
	}

	if (options.accept) {
		options.headers['Accept'] = options.accept;
	}

	if (options.contentType) {
		options.headers['Content-Type'] = options.contentType;
	}

	if (options.headers) {
		for (var name in options.headers) {
			xhr.setRequestHeader(name, options.headers[name]);
		}
	}

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status >= 200 && xhr.status < 400) {
				return options.success(xhr);
			} else {
				return options.error(xhr);
			}
		}
	};

	xhr.send(options.data);
};
