
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.readOnly === !data) return;

	data = data === undefined || data === null ? true : data;

	opt.element.readOnly = !data
	this.setData(opt, data);

}
