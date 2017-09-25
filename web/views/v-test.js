import Say from 'say.js';

var model = {
	mcar: 'mcar',
	car: '',
	cars: [],
	numRadio: 0,
	isChecked: true,
	text: 'Hello from model',
	items: [
		{ it: { val: 0 } },
		{ it: { val: 1 } },
		{ it: { val: 2 } }
	],
	html: '<h3 u-text="text"></h3>'
};

Ure.component.define({
	name: 'v-test',
	model: model,
	modifiers: {
		lower: function (text) {
			return text.toLowerCase();
		},
		upper: function (text) {
			return text.toUpperCase();
		}
	},
	events: {
		foo: function () {
			console.log('foo');
		},
		say: Say
	},
	created: function () {
		var self = this;

		window.SELF = self;

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
		}, 1000);

	},
	html: `
		<style>
			[u-each-item] {
				min-height: 150px;
			}
		</style>

		<p u-text="text | upper"></p>
		<p u-text="text | lower"></p>
		<input type="text" u-value="text | lower" placeholder="text">
		<input type="text" u-value="text | upper" placeholder="text">

		<br>
		<br>

		<div u-text="isChecked"></div>
		<input type="checkbox" u-value="isChecked">

		<br>
		<br>

		<div u-text="initiallyNotOnModel">initiallyNotOnModel</div>
		<input type="checkbox" u-value="initiallyNotOnModel">

		<br>
		<br>

		<div u-text="numRadio"></div>
		<input type="radio" u-value="numRadio">
		<input type="radio" u-value="numRadio">

		<br>
		<br>

		<div u-text="car"></div>
		<select u-value="car">
			<option value="audi">Audi</option>
			<option value="saab">Saab</option>
			<option value="volvo" selected>Volvo</option>
			<option value="mercedes">Mercedes</option>
		</select>

		<br>
		<br>

		<div u-text="cars"></div>
		<select u-value="cars" multiple>
			<option value="audi">Audi</option>
			<option value="saab" selected>Saab</option>
			<option value="volvo">Volvo</option>
			<option value="mercedes" selected>Mercedes</option>
		</select>

		<br>
		<br>

		<input type="text" u-value="items.0.it.val">
		<div u-each-item="items">
			<span>
				<span u-on-click="foo" u-text="item.it.val"></span>
				<span>,</span>
			</span>
		</div>


		<button u-on-click="say">Say Alert</button>
		<input type="text" u-value="nope">
		<input type="button" value="button">
		<input type="reset" value="reset">

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

		<div u-html="html"></div>
	`
});
