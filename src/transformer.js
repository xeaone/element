import Path from './path.js';

// FIXME import export in strings cause error
// FIXME double backtick in template strings or regex could possibly causes issues

export default {

	/*
		templates
	*/

	innerHandler (char, index, string) {
		if (string[index-1] === '\\') return;
		if (char === '\'') return '\\\'';
		if (char === '\"') return '\\"';
		if (char === '\t') return '\\t';
		if (char === '\n') return '\\n';
	},

	updateString (value, index, string) {
		return string.slice(0, index) + value + string.slice(index+1);
	},

	updateIndex (value, index) {
		return index + value.length-1;
	},

	template (data) {

		let first = data.indexOf('`');
		let second = data.indexOf('`', first+1);

		if (first === -1 || second === -1) return data;

		let value;
		let ends = 0;
		let starts = 0;
		let string = data;
		let isInner = false;

		for (let index = 0; index < string.length; index++) {
			let char = string[index];

			if (char === '`' && string[index-1] !== '\\') {

				if (isInner) {
					ends++;
					value = '\'';
					isInner = false;
					string = this.updateString(value, index, string);
					index = this.updateIndex(value, index);
				} else {
					starts++;
					value = '\'';
					isInner = true;
					string = this.updateString(value, index, string);
					index = this.updateIndex(value, index);
				}

			} else if (isInner) {

				if (value = this.innerHandler(char, index, string)) {
					string = this.updateString(value, index, string);
					index = this.updateIndex(value, index);
				}

			}

		}

		string = string.replace(/\${(.*?)}/g, '\'+$1+\'');

		if (starts === ends) {
			return string;
		} else {
			throw new Error('Oxe - Transformer missing backtick');
		}

	},

	/*
		modules
	*/

	patterns: {
		// lines: /(.*(?:;|\n))/g,
		// line: /(.*\s*{.*\s*.*\s*}.*)|((?:\/\*|`|'|").*\s*.*\s*(?:"|'|`|\*\/))|(.*(?:;|\n))/g,
		exps: /export\s+(?:default|var|let|const)?\s+/g,
		imps: /import(?:\s+(?:\*\s+as\s+)?\w+\s+from)?\s+(?:'|").*?(?:'|")/g,
		imp: /import(?:\s+(?:\*\s+as\s+)?(\w+)\s+from)?\s+(?:'|")(.*?)(?:'|")/
	},

	getImports (text, base) {
		let result = [];
		let imps = text.match(this.patterns.imps) || [];

		for (let i = 0, l = imps.length; i < l; i++) {
		 	let imp = imps[i].match(this.patterns.imp);

			result[i] = {
				raw: imp[0],
				name: imp[1],
				url: Path.resolve(imp[2], base),
				extension: Path.extension(imp[2])
			};

			if (!result[i].extension) {
				result[i].url = result[i].url + '.js';
			}

		}

		return result;
	},

	getExports (text) {
		let result = [];
		let exps = text.match(this.patterns.exps) || [];

		for (let i = 0, l = exps.length; i < l; i++) {
			let exp = exps[i];

			result[i] = {
				raw: exp,
				default: exp.indexOf('default') !== -1,
			};

		}

		return result;
	},

	replaceImports (text, imps) {

		if (!imps.length) {
			return text;
		}

		for (let i = 0, l = imps.length; i < l; i++) {
			let imp = imps[i];

			let pattern = (imp.name ? 'var ' + imp.name + ' = ' : '') + '$LOADER.data[\'' + imp.url + '\'].result';

			text = text.replace(imp.raw, pattern);
		}

		return text;
	},

	replaceExports (text, exps) {

		if (!exps.length) {
			return text;
		}

		if (exps.length === 1) {
			return text.replace(exps[0].raw, 'return ');
		}

		text = 'var $EXPORT = {};\n' + text;
		text = text + '\nreturn $EXPORT;\n';

		for (let i = 0, l = exps.length; i < l; i++) {
			text = text.replace(exps[i].raw, '$EXPORT.');
		}

		return text;
	},

	ast (data) {
		let result = {};

		result.url = data.url;
		result.raw = data.text;
		result.cooked = data.text;
		result.base = result.url.slice(0, result.url.lastIndexOf('/') + 1);

		result.imports = this.getImports(result.raw, result.base);
		result.exports = this.getExports(result.raw);

		result.cooked = this.replaceImports(result.cooked, result.imports);
		result.cooked = this.replaceExports(result.cooked, result.exports);

		return result;
	}

}
