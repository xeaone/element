
export default {
	template: function (data) {
		var count = 0;

		for (var i = 0; i < data.length; i++) {
			var char = data[i]
			if (char === '`') {
				var next = data.indexOf('`', i+1);
				if (next !== -1) {
					data = data.slice(0, i) +
						data.slice(i, next)
							.replace(/\'/g, '\\\'')
							.replace(/\t/g, '\\t')
							.replace(/\n/g, '\\n') +
						data.slice(next)
				}
			}
		}

	    return data
			.replace(/\${(\w+)}/g, '\\\' + $1 + \\\'')
			// .replace(/\`/g, function (match, index, string) {
			// 	if (last !== 0 && (i++ % 2) === 0) {
			// 		string = string.slice(last, index) // .replace(/\t|\n/g, '\\$1');
			// 		.replace(/\t/g, '\\t')
			// 		.replace(/\n/g, '\\n');
			// 	}
			// 	last = index;
			// 	return match;
			// })
	        .replace(/\`/g, function (match, index, string) {
	            return (count++ % 3) === 0 ? '\'' : match;
	        });
	}
}
