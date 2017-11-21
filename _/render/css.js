

export default function (opt) {
	var data = this.getData(opt);

	if (opt.element.style.cssText === data) {
		return;
	}

	if (opt.names.length > 1) {
		data = opt.names.slice(1).join('-') + ': ' +  data + ';';
	}

	opt.element.style.cssText += data;

}
