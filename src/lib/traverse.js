
export default function (opt) {

	var safe = opt.safe;
	var data = opt.data;
	var keys = opt.keys;
	var create = opt.create;
	var last = opt.keys.length === 0 ? 0 : opt.keys.length - 1;

	for (var i = 0; i < last; i++) {
		var key = keys[i];

		if (!(key in data)) {
			if (create === true) {
				if (isNaN(keys[i+1])) {
					data[key] = {};
				} else {
					data[key] = [];
				}
			} else {
			// } else if (create === false) {
				return undefined;
			}
		}

		data = data[key];
	}

	return {
		data: data,
		key: keys[last]
	};
};
