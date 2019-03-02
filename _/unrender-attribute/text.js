
export default function (binder) {
	return {
		write () {
			binder.element.innerText = '';
		}
	};
};
