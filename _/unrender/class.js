
export default function (opt) {

	var className = opt.names.slice(1).join('-');
	opt.element.classList.remove(className);

}
