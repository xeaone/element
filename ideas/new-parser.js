
let attributeMode = false;
let tagStartMode = false;
let specialMode = false;
let stringMode = false;
let stringChar = '';

for (let i = 0, l = html.length; i < l; i++) {
	let char = html[i];

	if (specialMode) {

		if (stringMode) {

			if (
				(
					char === '\'' ||
					char === '\"' ||
					char === '\`'
				) &&
				stringChar === char &&
				html[i-1] !== '\\'
			) {
				stringChar = '';
				stringMode = false;
			}

			continue;
		}

		if (!stringMode && char === '\'' || char === '\"' || char === '\`') {
			stringChar = char;
			stringMode = true;
			continue;
		}

	}

	if (!char) {
		continue;
	} else if (html.slice(i, 8) === '<script>') {
		specialMode = true;
		i += 8;
	} else if (html.slice(i, 7) === '<style>') {
		specialMode = true;
		i += 7;
	} else if (html.slice(i, 4) === '<!--') {
		specialMode = true;
		i += 4;
	} else if (html.slice(i, 9) === '</script>') {
		specialMode = false;
		i += 9;
	} else if (html.slice(i, 8) === '</style>') {
		specialMode = false;
		i += 8;
	} else if (html.slice(i, 3) === '-->') {
		specialMode = false;
		i += 3;
	} else if (specialMode) {
		continue;
	} else if (!tagStartMode && !attributeMode && char === '<') {
		tagStartMode = true;
		attributeMode = false;
	} else if (tagStartMode && char === ' ') {
		tagStartMode = false;
		attributeMode = true;
	} else if (attributeMode && char === '>') {
		tagStartMode = false;
		attributeMode = true;
	}

}
