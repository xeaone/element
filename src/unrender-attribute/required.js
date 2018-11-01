
export default function (binder) {
	return {
		write () {
			binder.element.required = false;
		}
	};
};
