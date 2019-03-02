
export default function (binder) {
	return {
		write () {
			binder.element.removeEventListener(binder.names[1], binder.cache, false);
		}
	};
};
