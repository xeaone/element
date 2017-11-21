

export default function (opt) {
	var data = this.getData(opt);

	var name = opt.names.slice(1).join('-');
	opt.element.classList.toggle(name, data);

}
