import Global from './global.js';

export default class Keeper {

	constructor (options) {

		this._ = {};
		this._.token;

		this.scheme = 'Bearer';
		this.type = 'sessionStorage';

		Object.defineProperties(this, {
			token: {
				enumerable: true,
				get: function () {
					return this._.token = this._.token || window[this.type].getItem('token');
				}
			},
			user: {
				enumerable: true,
				get: function () {
					return this._.user = this._.user || JSON.parse(window[this.type].getItem('user'));
				}
			}
		});

		this.setup(options);
	}

	setup (options) {
		options = options || {};

		this._.forbidden = options.forbidden || this._.forbidden;
		this._.unauthorized = options.unauthorized || this._.unauthorized;
		this._.authenticated = options.authenticated || this._.authenticated;
		this._.unauthenticated = options.unauthenticated || this._.unauthenticated;

		if (options.type) {
			this.type = options.type + 'Storage';
		}

		if (options.scheme) {
			this.scheme = options.scheme.slice(0, 1).toUpperCase() + options.scheme.slice(1);
		}

	}

	setToken (token) {
		if (!token) return;
		if (this.scheme === 'Basic') token = this.encode(token);
		this._.token = window[this.type].setItem('token', token);
	};

	setUser (user) {
		if (!user) return;
		user = JSON.stringify(user);
		this._.user = window[this.type].setItem('user', user);
	}

	removeToken () {
		this._.token = null;
		window[this.type].removeItem('token');
	}

	removeUser () {
		this._.user = null;
		window[this.type].removeItem('user');
	}

	authenticate (token, user) {
		this.setToken(token);
		this.setUser(user);

		if (typeof this._.authenticated === 'string') {
			Global.router.route(this._.authenticated);
		} else if (typeof this._.authenticated === 'function') {
			this._.authenticated();
		}

	}

	unauthenticate () {
		this.removeToken();
		this.removeUser();

		if (typeof this._.unauthenticated === 'string') {
			Global.router.route(this._.unauthenticated);
		} else if (typeof this._.unauthenticated === 'function') {
			this._.unauthenticated();
		}

	}

	forbidden (result) {

		if (typeof this._.forbidden === 'string') {
			Global.router.route(this._.forbidden);
		} else if (typeof this._.forbidden === 'function') {
			this._.forbidden(result);
		}

		return false;
	}

	unauthorized (result) {
		// NOTE might want to remove token and user
		// this.removeToken();
		// this.removeUser();

		if (typeof this._.unauthorized === 'string') {
			Global.router.route(this._.unauthorized);
		} else if (typeof this._.unauthorized === 'function') {
			this._.unauthorized(result);
		}

		return false;
	}

	route (result) {

		if (result.auth === false) {
			return true;
		} else if (!this.token) {
			return this.unauthorized(result);
		} else {
			return true;
		}

	}

	request (result) {

		if (result.opt.auth === false) {
			return true;
		} else if (!this.token) {
			return this.unauthorized(result);
		} else {
			result.xhr.setRequestHeader('Authorization', this.scheme + ' ' + this.token);
			return true;
		}

	}

	response (result) {

		if (result.statusCode === 401) {
			return this.unauthorized(result);
		} else if (result.statusCode === 403) {
			return this.forbidden(result);
		} else {
			return true;
		}

	}

	encode (data) {
		return window.btoa(data);
	}

	decode (data) {
	    return window.atob(data);
	}

}

/*

	https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding

	// encode (data) {
	// 	// encodeURIComponent to get percent-encoded UTF-8
	// 	// convert the percent encodings into raw bytes which
	// 	return window.btoa(window.encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, function (match, char) {
	// 		return String.fromCharCode('0x' + char);
	// 	}));
	// };
	//
	// decode (data) {
	// 	// from bytestream to percent-encoding to original string
	//     return window.decodeURIComponent(window.atob(data).split('').map(function(char) {
	//         return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
	//     }).join(''));
	// };

*/
