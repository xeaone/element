import Global from './global.js';

export default class Keeper {

	constructor (options) {
		this.scheme = 'Session';
		this.type = 'sessionStorage';
		this.setup(options);
	}

	setup (options) {
		options = options || {};

		if (options.type) {
			this.type = options.type + 'Storage';
		}

		if (options.scheme) {
			this.scheme = options.scheme.slice(0, 1).toUpperCase() + options.scheme.slice(1).toLowerCase();
		}

	}

	setToken (token) {
		if (!token) return;
		if (this.scheme === 'Basic') token = this.encode(token);
		window[this.type].setItem('token', token);
	};

	setUser (user) {
		if (!user) return;
		if (typeof user !== 'object') throw new Error('Oxe.keeper.setUser - requires object');
		window[this.type].setItem('user', JSON.stringify(user));
	}

	getToken () {
		return window[this.type].getItem('token');
	}

	getUser () {
		return JSON.parse(window[this.type].getItem('user') || {});
	}

	removeToken () {
		window[this.type].removeItem('token');
	}

	removeUser () {
		window[this.type].removeItem('user');
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
