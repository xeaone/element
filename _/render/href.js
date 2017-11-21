
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.href !== data) {
		opt.element.href = data;
		this.setData(opt, data);
	}

}
