
export default function UnrenderOn (opt, data) {
	opt.element.removeEventListener(opt.names[1], data, false);
}
