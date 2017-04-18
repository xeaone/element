
function has (string, search) {
	return string.indexOf(search) !== -1;
}

function clean (s) {
	return decodeURI(s)
	.replace(document.location.origin, '')
	.replace(/(^\/?#?\/)/, '')
	.replace(/(\/$)/, '');
}

function strip (s) {
	return clean(s).replace(/(\?.*?$)|(#.*?$)/g, '');
}

function getSearch (s) {
	return clean(s).split('?')[1] || '';
}

function getHash (s) {
	return clean(s).split('?')[0].split('#')[1] || '';
}

function getPathname (s) {
	return clean(s).split('?')[0].split('#')[0] || '';
}

module.exports = {
	has: has,
	clean: clean,
	strip: strip,
	getSearch: getSearch,
	getHash: getHash,
	getPathname: getPathname
};
