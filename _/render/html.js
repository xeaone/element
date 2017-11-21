
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.innerHTML !== data) {
		opt.element.innerHTML = data;
		this.setData(opt, data);
	}

}
