import Utility from '../utility.js';
import Global from '../../global.js';

export default function (opt) {
	var i , l, data;

	if (opt.element.type === 'checkbox') {
		data = false;
		opt.element.checked = data
		opt.element.value = data;
	} else if (opt.element.nodeName === 'SELECT') {
		data = [];
		var options = opt.element.options;
		for (i = 0, l = options.length; i < l; i++) {
			var option = options[i];
			option.selected = false;
		}
	} else if (opt.element.type === 'radio') {
		var query = 'input[type="radio"][o-value="' + path + '"]';
		var elements = opt.element.parentNode.querySelectorAll(query);
		for (i = 0, l = elements.length; i < l; i++) {
			var radio = elements[i];
			if (i === 0) {
				radio.checked = true;
			} else {
				radio.checked = false;
			}
		}
	} else {
		data = '';
		opt.element.value = data;
	}

	this.setData(opt.keys, data);
}
