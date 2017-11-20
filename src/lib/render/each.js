
export default function RenderEach (opt, data) {

	console.log(data);

	if (!opt.exists) {
		opt.variable = opt.names[1];
		opt.pattern = new RegExp('\\$(' + opt.variable + '|index)', 'ig');
		opt.clone = opt.element.removeChild(opt.element.firstElementChild);
		opt.clone = opt.clone.outerHTML.replace(
			new RegExp('((?:data-)?o-.*?=")' + opt.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
			'$1' + opt.path + '.$' + opt.variable + '$2'
		);
	}

	if (opt.element.children.length > data.length) {
		opt.element.removeChild(opt.element.lastElementChild);
		// RenderEach.call(this, opt, data);
	} else if (opt.element.children.length < data.length) {
		opt.element.insertAdjacentHTML('beforeend', opt.clone.replace(opt.pattern, opt.element.children.length));
		// RenderEach.call(this, opt, data);
	}

	if (!opt.exists) {
		return data || [];
	}

}
