
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.src !== data) {
		opt.element.src = data;
		this.setData(opt, data);
	}

}
