
export default function (binder, data) {
	return {
		// read () {
			// if (binder.cache) {
			// }
			// binder.cache = data;
		// },
		write () {
			if (!data) {
				binder.element.style = '';
			} else if (data.constructor === Object) {
				for (const name in data) {
					const value = data[name];
					if (value === null || value === undefined) {
						delete binder.element.style[name];
					} else {
						binder.element.style[name] = value;
					}
				}
			}
		}
	};
};
