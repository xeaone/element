// https://gist.github.com/Wind4/3baa40b26b89b686e4f2

var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

module.exports = function () {
	var chars = CHARS, uuid = [];

	// rfc4122, version 4 form
	var r;

	// rfc4122 requires these characters
	uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
	uuid[14] = '4';

	// Fill in random data. At i==19 set the high bits of clock sequence as per rfc4122, sec. 4.1.5
	for (var i = 0; i < 36; i++) {
		if (!uuid[i]) {
			r = 0 | Math.random() * 16;
			uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
		}
	}

	return uuid.join('');
};
