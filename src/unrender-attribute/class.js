
export default function (binder) {
	return {
		write () {
			const className = binder.names.slice(1).join('-');
			binder.element.classList.remove(className);
		}
	};
};
