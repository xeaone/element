
export default function (binder, data) {
	return {
		write () {
			let name = binder.names.slice(1).join('-');
			binder.target.classList.toggle(name, data);
		}
	};
};
