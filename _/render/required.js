
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.required === data) return;

	data = data === undefined || data === null ? true : data;

	opt.element.required = data
	this.setData(opt, data);

}
