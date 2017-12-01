import Say from '/modules/say.js';

var model = {
	blank: '',
	show_hide: true,
	mcar: 'mcar',
	car: '',
	cars: [],
	numRadio: 0,
	isChecked: true,
	text: 'Hello from model',
	loopy: { doopy: 'soopy' },
	items: [
		{ it: { val: 0 } },
		{ it: { val: 1 } },
		{ it: { val: 2 } }
	],
	arrayChange: [1, 2],
	html: '<h3 o-text="text"></h3>'
};

Oxe.component.define({
	name: 'v-test',
	model: model,
	modifiers: {
		lower: function (text) {
			text = text || '';
			return text.toLowerCase();
		},
		upper: function (text) {
			text = text || '';
			return text.toUpperCase();
		}
	},
	events: {
		say: Say,
		overwriteArray: function () {
			this.arrayChange = [3, 4, 5, 6];
		},
		foo: function () {
			console.log(this);
			console.log('foo');
		},
		toggle_show_hide: function () {
			this.show_hide = !this.show_hide;
		},
		submitGet: function () {
			console.log(arguments);
		},
		s0: function (data, e) {
			var model = this;
			if (data.username === '') {
				model.message = 'username required';
			} else {
				return {
					data: data,
					reset: true,
					url: '/foo',
					method: 'get',
					handler: function () {
						console.log(arguments);
					}
				}
			}
		},
		s1: function () {
			console.log(arguments);
			return {
				method: 'get',
				action: '/data.json',
				handler: function () {
					console.log(arguments);
					// e.target.reset();
				}
			}
		}
	},
	created: function () {
		var self = this;

		window.self = self;

		setTimeout(function () {

			var increaseInterval = setInterval(function () {

				if (self.model.items.length === 100) {
					clearInterval(increaseInterval);

					var decreaseInterval = setInterval(function () {

						if (self.model.items.length === 5) {
							clearInterval(decreaseInterval);
						}

						self.model.items.pop();

					}, 10);

				}

				self.model.items.push({ it: { val: self.model.items.length } });

			}, 10);

		}, 3000);

		Say('v-test created');
	},
	html: `
		<style>
			[o-each-item] {
				min-height: 150px;
			}
		</style>
		<br>
		<br>

		<strong o-text="nah">nah</strong>
		<strong o-show="isshow">isshow</strong>
		<strong o-hide="ishide">ishide</strong>

		<form o-submit="s0" o-reset>
			<div o-text="loopy.doopy"></div>
			<input type="text" o-value="loopy.doopy" placeholder="text" required><br>
			<input type="text" o-value="blank" placeholder="text" required><br>
			<input type="submit" name="Submit">
		</form>
		<br>
		<br>

		<form o-submit="s1">
			<input type="submit" name="Submit">
		</form>
		<br>
		<br>

		<div o-show="show_hide">Now you see me!</div>
		<button o-on-click="toggle_show_hide">Show/Hide</button>
		<br>
		<br>

		<e-menu>
			<li slot="one">Item One</li>
			<li slot="two">Item Two</li>
		</e-menu>
		<br>
		<br>

		<p o-text="text | upper"></p>
		<p o-text="text | lower"></p>
		<input type="text" o-value="text | lower" placeholder="text">
		<input type="text" o-value="text | upper" placeholder="text">
		<br>
		<br>

		<div o-text="isChecked"></div>
		<input type="checkbox" o-value="isChecked">
		<br>
		<br>

		<div o-text="initiallyNotOnModel">initiallyNotOnModel</div>
		<input type="checkbox" o-value="initiallyNotOnModel">
		<br>
		<br>

		<div o-text="numRadio"></div>
		<input type="radio" name="nr" o-value="numRadio">
		<input type="radio" name="nr" o-value="numRadio">
		<br>
		<br>

		<div o-text="car"></div>
		<select o-value="car">
			<option value="audi">Audi</option>
			<option value="saab">Saab</option>
			<option value="volvo" selected>Volvo</option>
			<option value="mercedes">Mercedes</option>
		</select>
		<br>
		<br>

		<div o-text="cars"></div>
		<select o-value="cars" multiple>
			<option value="audi">Audi</option>
			<option value="saab" selected>Saab</option>
			<option value="volvo">Volvo</option>
			<option value="mercedes" selected>Mercedes</option>
		</select>
		<br>
		<br>

		<input type="text" o-value="items.0.it.val">
		<div o-each-item="items">
			<span>
				<span>$item</span>
				<span o-on-click="foo" o-text="item.it.val"></span>
				<span>,</span>
			</span>
		</div>

		<button o-on-click="say">Console Log</button>
		<br>
		<br>

		<ul>
			<li>
				<a href="test/">test</a>
			</li>
			<li>
				<a href="js">js</a>
			</li>
			<li>
				<a href="js/?name=ferret&color=purple#hash">js/?name=ferret&amp;color=purple#hash</a>
			</li>
			<li>
				<a href="https://google.com/">google</a>
			</li>
			<li>
				<a href="https://google.com/" external>google external</a>
			</li>
			<li>
				<a href="https://google.com/" target="_blank">google target_blank</a>
			</li>
		</ul>

		<div o-html="html"></div>

		<div o-on-click="overwriteArray" o-each-ac="arrayChange">
			<div o-text="ac"></div>
		</div>

	`
});
