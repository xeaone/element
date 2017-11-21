
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.disabled === data) return;

	data = data === undefined || data === null ? true : data;

	opt.element.disabled = data;
	this.setData(opt, data);

}
