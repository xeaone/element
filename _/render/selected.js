
export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.selectedIndex === data) return;

	data = data === undefined || data === null ? 0 : data;
	opt.element.selectedIndex = data;
	this.setData(opt, data);

}
