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
	html: '<h3 j-text="text"></h3>'
};

Jenie.component({
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

		// setTimeout(function () {
		// 	var increaseInterval = setInterval(function () {
		//
		// 		if (self.model.items.length === 100) {
		// 			clearInterval(increaseInterval);
		//
		// 			var decreaseInterval = setInterval(function () {
		//
		// 				if (self.model.items.length === 5) {
		// 					clearInterval(decreaseInterval);
		// 				}
		//
		// 				self.model.items.pop();
		// 			}, 10);
		//
		// 		}
		//
		// 		self.model.items.push({ it: { val: self.model.items.length } });
		//
		// 	}, 10);
		// }, 1000);

	},
	html: `
		<style>
			[j-each-item] {
				min-height: 150px;
			}
		</style>

		<p j-text="text | upper"></p>
		<p j-text="text | lower"></p>
		<input type="text" j-value="text | lower" placeholder="text">
		<input type="text" j-value="text | upper" placeholder="text">

		<br>
		<br>

		<div j-text="isChecked"></div>
		<input type="checkbox" j-value="isChecked">

		<br>
		<br>

		<div j-text="initiallyNotOnModel">initiallyNotOnModel</div>
		<input type="checkbox" j-value="initiallyNotOnModel">

		<br>
		<br>

		<div j-text="numRadio"></div>
		<input type="radio" j-value="numRadio">
		<input type="radio" j-value="numRadio">

		<br>
		<br>

		<div j-text="car"></div>
		<select j-value="car">
			<option value="audi">Audi</option>
			<option value="saab">Saab</option>
			<option value="volvo" selected>Volvo</option>
			<option value="mercedes">Mercedes</option>
		</select>

		<br>
		<br>

		<div j-text="cars"></div>
		<select j-value="cars" multiple>
			<option value="audi">Audi</option>
			<option value="saab" selected>Saab</option>
			<option value="volvo">Volvo</option>
			<option value="mercedes" selected>Mercedes</option>
		</select>

		<br>
		<br>

		<input type="text" j-value="items.0.it.val">
		<div j-each-item="items">
			<span>
				<span j-on-click="foo" j-text="item.it.val"></span>
				<span>,</span>
			</span>
		</div>


		<button j-on-click="say">Say Alert</button>
		<input type="text" j-value="nope">
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

		<div j-html="html"></div>
	`
});
