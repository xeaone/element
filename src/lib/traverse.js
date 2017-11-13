
export default function (opt) {

	var data = opt.data;
	var keys = opt.keys;
	var last = opt.keys.length === 0 ? 0 : opt.keys.length - 1;

	for (var i = 0; i < last; i++) {
		var key = opt.keys[i];

		if (!(key in data)) {

			// if (key === '*') {
			// 	return star({
			// 		index: i,
			// 		ks: keys,
			// 		data: data,
			// 		keys: opt.keys,
			// 		value: opt.value
			// 	});
			// }

			// if (key === '.') {
			// 	return {
			// 		key: key,
			// 		keys: keys,
			// 		data: data
			// 	}
			// }

			if (opt.create === true) {
				if (isNaN(opt.keys[i+1])) {
					data[key] = {};
				} else {
					data[key] = [];
				}
			} else if (opt.create === false) {
				break;
			} else {
				return undefined;
				// throw new Error('Traverse - property ' + key + ' is undefined');
			}
		}

		data = data[key];
	}

	return {
		data: data,
		keys: keys,
		key: opt.keys[last]
	};
};
