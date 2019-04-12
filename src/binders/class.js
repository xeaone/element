
export default function (binder) {
	return {
		write () {
			const name = binder.names.slice(1).join('-');
			binder.target.classList.toggle(name, binder.data);
		}
	};
};
