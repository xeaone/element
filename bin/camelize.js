'use strict';

module.exports = function (data) {

	if (!data || typeof data !== 'string') {
		return '';
	}

	const alphanumeric = /[A-Za-z0-9]/;
	const symbol = /[\.\/_-]/;

	let isNotFirstWord = false;
	let result = '';

	for (let i = 0, l = data.length; i < l; i++) {

		if (alphanumeric.test(data[i])) {

			if (symbol.test(data[i-1]) && isNotFirstWord) {
				result += data[i].toUpperCase();
			} else {
				isNotFirstWord = true;
				result += data[i];
			}

		}

	}

	return result;
};
