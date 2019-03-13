
let ID = 0;
const tag = new Map();
const table = new Map();

// export default {
const d = {

	get tag () { return tag; },
	get table () { return table; },

	setup (options) {
		options = options || {};

		this.tags = options.tags || [];

		for (let i = 0, l = this.tags.length; i < l; i++) {
			const tag = this.tags[i];

			if (tag.indexOf('$') === 0) {
				throw new Error ('reserved internal tag $');
			}

			this.tag.set(tag, new Map());
		}

		this.tag.set('$id', new Map());

	},

	add (data) {
		const id = ID++;
		const tags = this.tags;

		this.table.set(id, data);

		for (let i = 0, l = tags.length; i < l; i++) {
			const tag = tags[i];

			if (tag in data) {
				let index;
				const key = data[tag];

				if (this.tag.get(tag).has(key)) {
					const length = this.tag.get(tag).get(key).push(id);
					index = length - 1;
				} else {
					index = 0;
					this.tag.get(tag).set(key, [id]);
				}

				if (this.tag.get('$id').has(id)) {
					this.tag.get('$id').get(id).push([tag, key, index]);
				} else {
					this.tag.get('$id').set(id, [[tag, key, index]]);
				}

			}
		}

	},

	get (id) {
		return this.table.get(id);
	},

	query (tag, key) {
		const result = [];

		if (!this.tag.has(tag)) {
			return result;
		}

		if (!this.tag.get(tag).has(key)) {
			return result;
		}

		if (tag.indexOf('$') === 0) {
			return this.tag.get(tag).get(key);
		}

		const ids = this.tag.get(tag).get(key);

		for (let i = 0, l = ids.length; i < l; i++) {
			const id = ids[i];
			result.push(this.table.get(id));
		}

		return result;
	},

	remove (id) {
		const tags = this.tags;

		this.table.delete(id);

		for (let i = 0, l = tags.length; i < l; i++) {
			const tag = tags[i];

			// if (tag in data) {
			const key = data[tag];
			if (this.tag.get(tag).has(key)) {
				this.tag.get(tag).get(key).push(id);
			} else {
				this.tag.get(tag).set(key, [id]);
			}
			// }
		}



		const data = this.table.get(id);

		for (let i = 0, l = tags.length; i < l; i++) {
			const tag = tags[i];

			if (this.tag.has(tag)) {
				const index = this.tag.get(tag).indexOf(id);

				if (index !== -1) {
					this.tag.get(tag).splice(index, 1);
				}
			}
		}

	}

};

const one = { name: 1, foo: 'bar' };
const two = { name: 1, cow: 'moo' };

d.setup({ tags: ['name', 'foo'] });
d.add(one);
d.add(two);

var r1 = d.query('foo', 'bar');
var r2 = d.query('name', 1);
var r3 = d.query('$id', 1);

console.log(r1);
console.log(r2);
console.log(r3);
