
export default {
	_innerHandler: function (char) {
		if (char === '\'') return '\\\'';
		if (char === '\"') return '\\"';
		if (char === '\t') return '\\t';
		if (char === '\n') return '\\n';
	},
	_updateString: function (value, index, string) {
		return string.slice(0, index) + value + string.slice(index+1);
	},
	_updateIndex: function (value, index) {
		return index + value.length-1;
	},
	// NOTE: double backtick in strings or regex could possibly causes issues
	template: function (data) {
		var first = data.indexOf('`');
		var second = data.indexOf('`', first+1);
		
		if (first === -1 || second === -1) return data;

		var value;
		var ends = 0;
		var starts = 0;
		var string = data;
		var isInner = false;

		for (var index = 0; index < string.length; index++) {
			var char = string[index];
			if (char === '`' && string[index-1] !== '\\' && string[index-1] !== '/') {
				if (isInner) {
					ends++;
					value = '\'';
					isInner = false;
					string = this._updateString(value, index, string);
					index = this._updateIndex(value, index);
				} else {
					starts++;
					value = '\'';
					isInner = true;
					string = this._updateString(value, index, string);
					index = this._updateIndex(value, index);
				}
			} else if (isInner) {
				if (value = this._innerHandler(char, index, string)) {
					string = this._updateString(value, index, string);
					index = this._updateIndex(value, index);
				}
			}
		}

		string = string.replace(/\${(.*?)}/g, '\'+$1+\'');

		if (starts === ends) {
			return string;
		} else {
			throw new Error('Transformer miss matched backticks');
		}
	}
}
