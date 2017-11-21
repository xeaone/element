import Utility from '../../utility';

export default function (opt) {
	var data = this.getData(opt);

	if (typeof data === 'object') {
		 data = JSON.stringify(data);
	} else {
		data = String(data);
	}

	opt.element.innerText = data;

	// this.setData(opt, data);
}
