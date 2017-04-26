module.exports = {
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
	},
	// isSameOrigin: function (path) {
	// 	return path && path.indexOf(window.location.origin) > -1;
	// },
	// isSamePath: function (pathOne, pathTwo) {
	// 	return this.path(pathOne || '') === this.path(pathTwo || '');
	// },
};
