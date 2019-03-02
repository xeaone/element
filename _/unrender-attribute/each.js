
export default function (binder) {
	return {
		write () {
			let element;
			while (element = binder.element.lastElementChild) {
				binder.element.removeChild(element);
			}
		}
	};
};
