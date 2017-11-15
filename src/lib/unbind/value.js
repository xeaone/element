import Utility from '../utility.js';
import Global from '../../global.js';

export default function (element) {
	var i , l, data;

	var value = element.getAttribute('o-value');
	if (!value) return;

	var path = Utility.binderPath(value);

	var container = Utility.getContainer(element);
	if (!container) return;

	var uid = container.getAttribute('o-uid');

	if (element.type === 'checkbox') {
		data = false;
		element.checked = data
		element.value = data;
	} else if (element.nodeName === 'SELECT') {
		data = [];
		var options = element.options;
		for (i = 0, l = options.length; i < l; i++) {
			var option = options[i];
			option.selected = false;
		}
	} else if (element.type === 'radio') {
		var query = 'input[type="radio"][o-value="' + path + '"]';
		var elements = element.parentNode.querySelectorAll(query);
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
		element.value = data;
	}

	var keys = uid + '.' + path.split('.');
	Global.model.set(keys, data);
}
