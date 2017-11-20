import Utility from '../utility';

export default function (opt, data) {
	opt.element.innerText = Utility.toText(data);
}
