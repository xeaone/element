
const Parse = function (data, parent) {
	let result = [];
	for (let name in data) {
		if (typeof data[name] === 'object') {
			result.push(Parse(data[name], name);
		} else {
			result.push(`${parent ? `${parent}[${name}]` : name}=${data[name]}`);
		}
	}
	return result.join('&');
};

const r = Parse({
	foo: {
		bar: 1
	},
	moo: 'cow'
});

console.log(r);
