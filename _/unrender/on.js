
export default function UnrenderOn (opt) {
	opt.element.removeEventListener(opt.names[1], opt.cache, false);
}
