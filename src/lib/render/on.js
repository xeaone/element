
export default function RenderOn (opt, data) {
	if (opt.exists) {
		opt.element.removeEventListener(opt.names[1], data);
		data = data.bind(opt.model);
		opt.element.addEventListener(opt.names[1], data);
	} else {
		data = data.bind(opt.model);
		opt.element.addEventListener(opt.names[1], data);
	}
	return data;
}
