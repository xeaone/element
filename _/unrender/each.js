
export default function (opt) {
	var element;

	while (element = element.lastElementChild) {
		element.removeChild(element);
	}

}
