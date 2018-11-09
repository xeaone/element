
export default function (binder) {
	return {
		write () {
			var className = binder.names.slice(1).join('-');
			binder.element.classList.remove(className);
		}
	};
};
