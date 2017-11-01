import INDEX from './index';

export default function Keeper (options) {
	this._ = {};
	this._.token;

	this.scheme = 'Basic';
	this.type = 'sessionStorage';

	Object.defineProperty(this, 'token', {
		enumerable: true,
		get: function () {
			return this._.token = this._.token || window[this.type].getItem('token');
		}
	});

	this.setup(options);
}

Keeper.prototype.setup = function (options) {
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

};

Keeper.prototype.authenticate = function (token) {
	this._.token = window[this.type].setItem('token', token);
	if (typeof this._.authenticated === 'string') {
		INDEX.router.navigate(this._.authenticated);
	} else if (typeof this._.authenticated === 'function') {
		this._.authenticated();
	}
};

Keeper.prototype.unauthenticate = function (token) {
	this._.token = null;
	window[this.type].removeItem('token');
	if (typeof this._.unauthenticated === 'string') {
		INDEX.router.navigate(this._.unauthenticated);
	} else if (typeof this._.unauthenticated === 'function') {
		this._.unauthenticated();
	}
};

Keeper.prototype.forbidden = function (result) {
	if (typeof this._.forbidden === 'string') {
		INDEX.router.navigate(this._.forbidden);
	} else if (typeof this._.forbidden === 'function') {
		this._.forbidden(result);
	}

	return false;
};

Keeper.prototype.unauthorized = function (result) {
	if (typeof this._.unauthorized === 'string') {
		INDEX.router.navigate(this._.unauthorized);
	} else if (typeof this._.unauthorized === 'function') {
		this._.unauthorized(result);
	}

	return false;
};

Keeper.prototype.route = function (result) {
	if (result.auth === false) {
		return true;
	} else if (!this.token) {
		return this.unauthorized(result);
	} else {
		return true;
	}
};

Keeper.prototype.request = function (result) {
	if (result.opt.auth === false) {
		return true;
	} else if (!this.token) {
		return this.unauthorized(result);
	} else {
		result.xhr.setRequestHeader('Authorization', this.scheme + ' ' + this.token);
		return true;
	}
};

Keeper.prototype.response = function (result) {
	if (result.statusCode === 401) {
		return this.unauthorized(result);
	} else if (result.statusCode === 403) {
		return this.forbidden(result);
	} else {
		return true;
	}
};

/*
	Resources:
		https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
		https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
*/

// Keeper.prototype.encode = function (data) {
// 	// encodeURIComponent to get percent-encoded UTF-8
// 	// convert the percent encodings into raw bytes which
// 	return window.btoa(window.encodeURIComponent(data).replace(/%([0-9A-F]{2})/g,
// 		function toSolidBytes (match, char) {
// 			return String.fromCharCode('0x' + char);
// 	}));
// };
//
// Keeper.prototype.decode = function (data) {
// 	// from bytestream to percent-encoding to original string
//     return window.decodeURIComponent(window.atob(data).split('').map(function(char) {
//         return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
//     }).join(''));
// };
