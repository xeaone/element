
export default function RenderEach (opt) {
	var data = this.getData(opt);

	if (!data) {
		data = [];
		this.setData(opt, data);
	}

	if (opt.element.children.length > data.length) {
		opt.element.removeChild(opt.element.lastElementChild);
	} else if (opt.element.children.length < data.length) {
		opt.element.insertAdjacentHTML('beforeend', opt.clone.replace(opt.pattern, opt.element.children.length));
	}

	if (opt.element.children.length !== data.length) {
		this.batch(RenderEach.bind(this, opt));
	}

}
