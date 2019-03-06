
export default function (binder, data) {
	return {
		read () {

			if (binder.names.length > 1) {
				data = binder.names.slice(1).join('-') + ': ' +  data + ';';
			}

			if (data === binder.element.style.cssText) {
				return false;
			}

		},
		write () {
			binder.element.style.cssText = data;
		}
	};
};
