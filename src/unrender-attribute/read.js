
export default function (binder) {
	return {
		write () {
			binder.element.readOnly = false;
		}
	};
};
