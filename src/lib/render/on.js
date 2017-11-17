
export default function RenderOn (opt) {
	if (opt.exists) {
		opt.element.removeEventListener(opt.names[1], opt.data);
		opt.data = opt.data.bind(opt.model);
		opt.element.addEventListener(opt.names[1], opt.data);
	} else {
		opt.data = opt.data.bind(opt.model);
		opt.element.addEventListener(opt.names[1], opt.data);
	}
}
