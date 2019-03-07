
export default function (binder, data) {
	return {
		// read () {
			// if (binder.cache) {
			// }
			// binder.cache = data;
		// },
		write () {
			if (!data) {
				binder.target.style = '';
			} else if (data.constructor === Object) {
				for (const name in data) {
					const value = data[name];
					if (value === null || value === undefined) {
						delete binder.target.style[name];
					} else {
						binder.target.style[name] = value;
					}
				}
			}
		}
	};
};
