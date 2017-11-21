
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.hidden === data) return;

	data = data === undefined || data === null ? true : data;

	opt.element.hidden = data
	this.setData(opt, data);

}
