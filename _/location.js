import Path from './lib/path.js';

export default class Location {

	constructor (options) {
		this.hash = options.hash || false;
		this.trailing = options.trailing || false;
	}

	create (path) {
		var location = {};

		location.port = window.location.port;
		location.host = window.location.host;
		location.hash = window.location.hash;
		location.origin = window.location.origin;
		location.hostname = window.location.hostname;
		location.protocol = window.location.protocol;
		location.username = window.location.username;
		location.password = window.location.password;

		location.pathname = path;
		location.base = Path.base();
		location.basename = location.base;

		if (location.basename.indexOf(location.origin) === 0) {
			location.basename = location.basename.slice(location.origin.length);
		}

		if (location.pathname.indexOf(location.origin) === 0) {
			location.pathname = location.pathname.slice(location.origin.length);
		}

		if (location.pathname.indexOf(location.basename) === 0) {
			location.pathname = location.pathname.slice(location.basename.length);
		}

		if (location.pathname.indexOf(location.basename.slice(0, -1)) === 0) {
			location.pathname = location.pathname.slice(location.basename.slice(0, -1).length);
		}

		if (
			this.hash
			&& location.pathname.indexOf('#') === 0
			|| location.pathname.indexOf('/#') === 0
			|| location.pathname.indexOf('#/') === 0
			|| location.pathname.indexOf('/#/') === 0
		) {
			location.pathname = location.pathname.slice(2);
		}

		var hashIndex = location.pathname.indexOf('#');
		if (hashIndex !== -1) {
			location.hash = location.pathname.slice(hashIndex);
			location.pathname = location.pathname.slice(0, hashIndex);
		} else {
			location.hash = '';
		}

		var searchIndex = location.pathname.indexOf('?');
		if (searchIndex !== -1) {
			location.search = location.pathname.slice(searchIndex);
			location.pathname = location.pathname.slice(0, searchIndex);
		} else {
			location.search = '';
		}

		location.routePath = Path.join('/', location.pathname);
		location.pathname = Path.join(location.basename, location.pathname);
		location.href = Path.join(location.origin, this.hash ? '#' : '/', location.pathname);

		if (this.trailing) {
			location.href = Path.join(location.href, '/');
			location.pathname = Path.join(location.pathname, '/');
		} else {
			location.href = location.href.replace(/\/{1,}$/, '');
			location.pathname = location.pathname.replace(/\/{1,}$/, '');
		}

		if (this.hash && /\/#$/.test(location.href)) {
			location.href = location.href + '/';
		}

		location.routePath = location.routePath || '/';
		location.pathname = location.pathname || '/';
		location.href += location.search;
		location.href += location.hash;

		return location;
	}

}
