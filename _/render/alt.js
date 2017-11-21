
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.alt === data) {
		return;
	}

	opt.element.alt = data;
	this.setData(opt, data);

}
