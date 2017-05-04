
module.exports = {
	has: function (string, search) {
		return string.indexOf(search) !== -1;
	},
	normalize: function (path) {
		path = decodeURI(path)
		.replace(/\/{2,}/g, '/')
		.replace(/\?.*/, '')
		.replace(/\/$/, '');
		return path === '' ? '/' : path;
	},
	getHash: function (path) {
		return this.normalize(path
			.split('?')[0].split('#')[1] || ''
		);
	},
	getSearch: function (path) {
		return this.normalize(path
			.split('?')[1] || ''
		);
	},
	getPath: function (path, base, root) {
		return this.normalize(path
			.replace(window.location.origin, '/')
			.replace(base, '/')
			.replace(root, '/')
		);
	}
};
