
export default function (binder, data) {
	return {
		read () {

			if (data === undefined || data === null) {
				return false;
			} else if (typeof data === 'object') {
				data = JSON.stringify(data);
			} else if (typeof data !== 'string') {
				data = data.toString();
			}

			if (data === binder.target.textContent) {
				return false;
			}

		},
		write () {
			binder.target.textContent = data;
		}
	};
};
