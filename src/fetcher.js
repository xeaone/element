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

	change (opt, xhr) {
		var self = this;

		if (xhr.readyState === 4) {

			var result = {
				opt: opt,
				xhr: xhr,
				code: xhr.status,
				message: xhr.statusText
			};

			if (xhr['response'] !== undefined) {
				result.data = xhr.response;
			} else if (xhr['responseText'] !== undefined) {
				result.data = xhr.responseText;
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
				if (opt.auth) {
					if (Global.keeper.response && Global.keeper.response(result) === false) {
						return;
					}
				}
			}

			var end = function () {
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
			};

			if (this.response) {
				var responseResult = this.response(result);

				if (responseResult === false) {
					return;
				} else if (responseResult && responseResult.constructor === Promise) {
					responseResult.then(function (r) {
						if (r !== false) {
							end();
						}
					}).catch(function (error) {
						console.error(error);
					});
				} else {
					end();
				}

			} else {
				end();
			}

			// if (this.response && this.response(result) === false) {
			// 	return;
			// }

			// if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
			//
			// 	if (opt.success) {
			// 		opt.success(result);
			// 	} else if (opt.handler) {
			// 		opt.error = false;
			// 		opt.handler(result);
			// 	}
			//
			// } else {
			//
			// 	if (opt.error) {
			// 		opt.error(result);
			// 	} else if (opt.handler) {
			// 		opt.error = true;
			// 		opt.handler(result);
			// 	}
			//
			// }

		}
	}

	fetch (opt) {
		var data;
		var self = this;
		var xhr = new XMLHttpRequest();

		opt = opt || {};

		if (!opt.url) throw new Error('Oxe.fetcher - requires url options');

		opt.headers = opt.headers || {};
		opt.method = opt.method || this.method;
		opt.acceptType = opt.acceptType || this.acceptType;
		opt.contentType = opt.contentType || this.contentType;
		opt.responseType = opt.responseType || this.responseType;
		opt.auth = opt.auth === undefined || opt.auth === null ? this.auth : opt.auth;

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

		var result = {
			xhr: xhr,
			opt: opt,
			data: opt.data
		};

		if (opt.auth) {
			if (Global.keeper.request && Global.keeper.request(result) === false) {
				return;
			}
		}

		var end = function () {
			xhr.onreadystatechange = self.change.bind(self, opt, xhr);
			xhr.send(data);
		};

		if (this.request) {
			var requestResult = this.request(result);

			if (requestResult === false) {
				return;
			} else if (requestResult && requestResult.constructor === Promise) {
				requestResult.then(function (r) {
					if (r !== false) {
						end();
					}
				}).catch(function (error) {
					console.error(error);
				});
			} else {
				end();
			}

		} else {
			end();
		}

		// if (this.request && this.request(result) === false) {
		// 	return;
		// }
		//
		// xhr.onreadystatechange = this.change.bind(this, opt, xhr);
		// xhr.send(data);
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
