
var mime = {
	html: 'text/html',
	text: 'text/plain',
	xml: 'application/xml, text/xml',
	json: 'application/json, text/javascript',
	urlencoded: 'application/x-www-form-urlencoded',
	script: 'text/javascript, application/javascript, application/x-javascript'
};

function serialize (data) {
	var string = '';

	for (var name in data) {
		string = string.length > 0 ? string + '&' : string;
		string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
	}

	return string;
}

function fetch (options) {
	if (!options) throw new Error('fetch: requires options');
	if (!options.action) throw new Error('fetch: requires options.action');
	if (!options.method) options.method = 'GET';
	if (!options.headers) options.headers = {};

	if (options.data) {
		if (options.method === 'GET') {
			options.action = options.action + '?' + serialize(options.data);
			options.data = null;
		} else {
			options.requestType = options.requestType ? options.requestType.toLowerCase() : '';
			options.responseType = options.responseType ? options.responseType.toLowerCase() : '';

			switch (options.requestType) {
				case 'script': options.contentType = mime.script; break;
				case 'json': options.contentType = mime.json; break;
				case 'xml': options.contentType = mime.xm; break;
				case 'html': options.contentType = mime.html; break;
				case 'text': options.contentType = mime.text; break;
				default: options.contentType = mime.urlencoded;
			}

			switch (options.responseType) {
				case 'script': options.accept = mime.script; break;
				case 'json': options.accept = mime.json; break;
				case 'xml': options.accept = mime.xml; break;
				case 'html': options.accept = mime.html; break;
				case 'text': options.accept = mime.text; break;
			}

			if (options.contentType === mime.json) options.data = JSON.stringify(options.data);
			if (options.contentType === mime.urlencoded) options.data = serialize(options.data);
		}
	}

	var xhr = new XMLHttpRequest();
	xhr.open(options.method.toUpperCase(), options.action, true, options.username, options.password);

	if (options.mimeType) xhr.overrideMimeType(options.mimeType);
	if (options.withCredentials) xhr.withCredentials = options.withCredentials;

	if (options.accept) options.headers['Accept'] = options.accept;
	if (options.contentType) options.headers['Content-Type'] = options.contentType;

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
}

module.exports = {
	mime: mime,
	fetch: fetch,
	serialize: serialize
};
