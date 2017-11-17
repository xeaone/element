import Global from '../../global.js';

export default function (opt) {
	var i , l, data;
	
	data = this.getData(opt.keys);

	if (opt.element.type === 'checkbox') {
		data = !data ? false : data;
		opt.element.checked = data;
		opt.element.value = data;
	} else if (opt.element.nodeName === 'SELECT') {
		var options = opt.element.options;
		data = opt.element.multiple ? [] : data;
		for (i = 0, l = options.length; i < l; i++) {
			var option = options[i];
			if (option.selected) {
				if (opt.element.multiple) {
					data.push(option.value);
				} else {
					data = option.value;
					break;
				}
			}
		}
	} else if (opt.element.type === 'radio') {
		var query = 'input[type="radio"][o-value="' + opt.attribute.value + '"]';
		var elements = opt.element.parentNode.querySelectorAll(query);
		for (i = 0, l = elements.length; i < l; i++) {
			var radio = elements[i];
			radio.checked = i === data;
		}
	} else {
		data = data === undefined ? '' : data;
		opt.element.value = data;
	}

	this.setData(opt.keys, data);
}
