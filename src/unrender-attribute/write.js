
export default function (binder) {
	var data;

	return {
		write () {
			binder.element.readOnly = true;
		}
	};
};
