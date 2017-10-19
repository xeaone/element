// 401 Unauthorized
// 403 Forbidden
// scheme: Basic, Bearer, Digest, HOBA, Mutual, AWS4-HMAC-SHA256

// NOTE add cookie type
// NOTE add preflight to router

export default function Auth (options) {
	this.setup(options);
}

Auth.prototype.setup = function (options) {
	var creds;

	options = options || {};

	this._ = {};
	this._.failure = options.failure;

	this.scheme = options.scheme || 'Basic';
	this.type = options.type ? 'sessionStorage' : options.type + 'Storage';

	Object.defineProperty(this, 'creds', {
		enumerable: true,
		// configurable: true,
		get: function () {
			return creds = creds ? creds : window[this.type].getItem('creds');
		},
		set: function (data) {
			return creds = window[this.type].setItem('creds', data);
		}
	});
};

Auth.prototype.setCreds = function (creds) {
	return window[this.type].setItem('creds', creds);
};

Auth.prototype.getCreds = function () {
	return window[this.type].getItem('creds');
};

Auth.prototype.modify = function (xhr) {
	xhr.setRequestHeader('Authorization', this.scheme + ' ' + this.creds);
};

Auth.prototype.failure = function (data) {
	this._.failure(data);
};

// Resources: https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
