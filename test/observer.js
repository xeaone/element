
var Neml = require('node-es-module-loader');
var Path = require('path');

var Loader = new Neml();
var path = Path.resolve('src/controller/observer.js');

Loader.import(path).then(function (m) {
	var Observer = m.default;

	/*
		observer without the callback adds between ~0.05ms and ~0.180ms
	*/

	var native = {
		num: 1,
		foo0: 'bar0',
		obj0: {
			foo1: 'bar1',
			obj1: {
				foo2: 'bar2',
			}
		},
		fruit: ['cherries', 'apples', 'bananas'],
		numbers: ['three', 'four', 'five']
	};

	var observer = Observer({
		num: 1,
		foo0: 'bar0',
		obj0: {
			foo1: 'bar1',
			obj1: {
				foo2: 'bar2',
			}
		},
		fruit: ['cherries', 'apples', 'bananas'],
		numbers: ['three', 'four', 'five']
	}
	// , function (value, path, key, collection) {
	// 	console.log('value: ' + value);
	// 	console.log('path: ' + path);
	// 	console.log('key: ' + key);
	// 	console.log(collection);
	// }
	);

	// Object $set new
	observer.$set('foo', 'bar');

	// Object $set existing
	observer.$set('num', 3);

	// Object $remove
	observer.$remove('foo');

	// Array Push
	console.time('observer: push');
	observer.numbers.push('six', 'seven');
	console.timeEnd('observer: push');

	console.time('native: push');
	native.numbers.push('six', 'seven');
	console.timeEnd('native: push');

	// Array Unshift
	console.time('observer: unshift');
	observer.numbers.unshift('zero', 'one', 'two');
	console.timeEnd('observer: unshift');

	console.time('native: unshift');
	native.numbers.unshift('zero', 'one', 'two');
	console.timeEnd('native: unshift');

	// Array Pop
	console.time('observer: pop');
	observer.fruit.pop();
	console.timeEnd('observer: pop');

	console.time('native: pop');
	native.fruit.pop();
	console.timeEnd('native: pop');

	// Array Shift
	console.time('observer: shift');
	observer.fruit.shift();
	console.timeEnd('observer: shift');

	console.time('native: shift');
	native.fruit.shift();
	console.timeEnd('native: shift');

	// Array Splice
	console.time('observer: splice');
	observer.fruit.splice(0, 1, 'mango', 'orange');
	console.timeEnd('observer: splice');

	console.time('native: splice');
	native.fruit.splice(0, 1, 'mango', 'orange');
	console.timeEnd('native: splice');

	// Observer Redfine
	var observer2 = Observer(observer, function () {
		console.log('observer2 callback fires on change');
	});

	observer2.num = 8;
	console.log('observer2 === observer: ' + (observer2 === observer));

}).catch(function (error) {
	console.error(error);
});
