
const PathPattern = new RegExp('(\\$)(\\w+)($|,|\\s+|\\.|\\|)', 'ig');
const KeyPattern = new RegExp('({{\\$)(\\w+)((-(key|index))?}})', 'ig');

export default function (binder) {
	return {
		write () {
			if (binder.target.nodeType === Node.TEXT_NODE) {
				binder.target.nodeValue = binder.target.nodeValue.replace(KeyPattern, binder.meta.key);
			} else if (binder.target.nodeType === Node.ELEMENT_NODE) {
				console.log(binder);
				const attributes = binder.target.attributes;
				for (let i = 0, l = attributes.length; i < l; i++) {
					const attribute = attributes[i];
					attribute.value = attribute.value.replace(KeyPattern, `${binder.meta.key}`);
					attribute.value = attribute.value.replace(PathPattern, `${binder.meta.path}.${binder.meta.key}$3`);
				}
			}
		}
	}
};
