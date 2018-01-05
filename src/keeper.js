import Global from './global';

var Keeper = function (options) {

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
};

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

Keeper.prototype.setToken = function (token) {
	if (!token) return;
	if (this.scheme === 'Basic') token = this.encode(token);
	this._.token = window[this.type].setItem('token', token);
};

Keeper.prototype.setUser = function (user) {
	if (!user) return;
	user = JSON.stringify(user);
	this._.user = window[this.type].setItem('user', user);
};

Keeper.prototype.removeToken = function () {
	this._.token = null;
	window[this.type].removeItem('token');
};

Keeper.prototype.removeUser = function () {
	this._.user = null;
	window[this.type].removeItem('user');
};

Keeper.prototype.authenticate = function (token, user) {
	this.setToken(token);
	this.setUser(user);

	if (typeof this._.authenticated === 'string') {
		Global.router.navigate(this._.authenticated);
	} else if (typeof this._.authenticated === 'function') {
		this._.authenticated();
	}

};

Keeper.prototype.unauthenticate = function () {
	this.removeToken();
	this.removeUser();

	if (typeof this._.unauthenticated === 'string') {
		Global.router.navigate(this._.unauthenticated);
	} else if (typeof this._.unauthenticated === 'function') {
		this._.unauthenticated();
	}

};

Keeper.prototype.forbidden = function (result) {

	if (typeof this._.forbidden === 'string') {
		Global.router.navigate(this._.forbidden);
	} else if (typeof this._.forbidden === 'function') {
		this._.forbidden(result);
	}

	return false;
};

Keeper.prototype.unauthorized = function (result) {
	// NOTE might want to remove token and user
	// this.removeToken();
	// this.removeUser();

	if (typeof this._.unauthorized === 'string') {
		Global.router.navigate(this._.unauthorized);
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

Keeper.prototype.encode = function (data) {
	return window.btoa(data);
};

Keeper.prototype.decode = function (data) {
    return window.atob(data);
};

export default Keeper;

/*

	https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding

	// Keeper.prototype.encode = function (data) {
	// 	// encodeURIComponent to get percent-encoded UTF-8
	// 	// convert the percent encodings into raw bytes which
	// 	return window.btoa(window.encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, function (match, char) {
	// 		return String.fromCharCode('0x' + char);
	// 	}));
	// };
	//
	// Keeper.prototype.decode = function (data) {
	// 	// from bytestream to percent-encoding to original string
	//     return window.decodeURIComponent(window.atob(data).split('').map(function(char) {
	//         return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
	//     }).join(''));
	// };

*/
