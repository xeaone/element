
export default function (opt) {
	var data = this.getData(opt);

	opt.cache = data.bind(opt.model);
	opt.element.addEventListener(opt.names[1], opt.cache);

}
