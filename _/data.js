
let POINTER = 0;
const tag = new Map();
const table = new Map();

// const d = {
export default {

	get tag () { return tag; },
	get table () { return table; },

	async setup (options) {
		options = options || {};

		this.tags = options.tags || [];
		this.pointer = options.pointer || '$pointer';

		for (let i = 0, l = this.tags.length; i < l; i++) {
			const tag = this.tags[i];
			if (tag.indexOf('$') === 0) {
				throw new Error ('reserved internal tag $');
			} else {
				this.tag.set(tag, new Map());
			}
		}

		this.tag.set('$location', new Map());
	},

	add (data) {
		let pointer;

		if (this.pointer === '$pointer') {
			pointer = POINTER++;
			Object.defineProperty(data, '$pointer', { value: pointer });
		} else if (this.pointer in data === false) {
			throw new Error('Oxe.data.add - data argument requires pointer');
		} else {
			pointer = data[this.pointer];
		}

		const tags = this.tags;

		if (this.table.has(pointer)) {
			throw new Error('Oxe.data.add - pointer property exists');
		}

		this.table.set(pointer, data);

		for (let i = 0, l = tags.length; i < l; i++) {
			const tag = tags[i];

			if (tag in data) {
				let index;
				const key = data[tag];

				if (this.tag.get(tag).has(key)) {
					const length = this.tag.get(tag).get(key).push(pointer);
					index = length - 1;
				} else {
					index = 0;
					this.tag.get(tag).set(key, [pointer]);
				}

				if (this.tag.get('$location').has(pointer)) {
					this.tag.get('$location').get(pointer).push([tag, key, index]);
				} else {
					this.tag.get('$location').set(pointer, [[tag, key, index]]);
				}

			}

		}
	},

	query (tag, key, option) {
		const result = [];

		option = option || {};

		if (!this.tag.has(tag)) {
			return result;
		}

		if (!this.tag.get(tag).has(key)) {
			return result;
		}

		if (tag.indexOf('$') === 0) {
			return this.tag.get(tag).get(key);
		}

		const pointers = this.tag.get(tag).get(key);

		for (let i = 0, l = pointers.length; i < l; i++) {
			const pointer = pointers[i];
			const data = this.table.get(pointer);

			if (option.includes) {
				let includes = true;

				for (const name in option.includes) {
					if (data[name] !== option.includes[name]) {
						includes = false;
						break;
					}
				}

				if (includes === true) {
					result.push(data);
				}

			} else {
				result.push(data);
			}
		}

		return result;
	},

	remove (pointer) {

		if (!this.table.has(pointer)) return;

		this.table.delete(pointer);

		if (!this.tag.get('$location').has(pointer)) return;

		const locations = this.tag.get('$location').get(pointer);

		for (let i = 0, l = locations.length; i < l; i++) {
			const location = locations[i];
			const tag = location[0];
			const key = location[1];
			const index = location[2];

			if (this.tag.has(tag)) {
				if (this.tag.get(tag).has(key)) {
					if (this.tag.get(tag).get(key)[index]) {
						this.tag.get(tag).get(key).splice(index, 1);
					}
				}
			}
		}

	},

	get (pointer) {
		return this.table.get(pointer);
	}

};

// d.setup({
// 	pointer: 'pointer',
// 	tags: ['type']
// });
//
// d.add({ pointer: 1, type: 'monkey' });
// d.add({ pointer: 2, type: 'monkey' });
// d.add({ pointer: 'three', type: 'dog' });
// d.add({ pointer: 4, type: 'cat' });
//
// console.log('query: type monkey', d.query('type', 'monkey'));
// console.log('query: $location 4', d.query('$location', 4));
//
// console.log('get: three', d.get('three'));
//
// d.remove('three');
//
// console.log('get: three', d.get('three'));
