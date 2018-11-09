
export default function (binder) {
	let data;

	return {
		write () {
			binder.element.readOnly = true;
		}
	};
};
