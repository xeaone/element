
export default function (opt) {
	var element;

	while (element = opt.element.lastElementChild) {
		opt.element.removeChild(element);
	}

}
