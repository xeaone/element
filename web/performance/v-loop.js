
Oxe.component.define({
	name: 'v-loop',
	html: `
		<style>
			html, body, o-loop {
				width: 100%;
				display: block;
			}
			.box {
				margin: 5px;
				padding: 5px;
				/*background: grey;*/
				display: inline-block;
			}
		</style>

		<!--
			<div>
				<span>Count Down: </span>
				<span o-text="counter"></span>
			</div>
		-->

		<div o-each-item="items">
			<div class="box">
				<div o-text="item.number"></div>
				<input type="text" o-value="item.number">
			</div>
			<!--<button o-on-click="click">
				<div o-text="item.number"></div>
			</button>-->
		</div>
	`,
	model: {
		// counter: 3,
		items: [
			{ number: 0 },
		]
	},
	// events: {
	// 	click: function (e) {
	// 		console.log(e);
	// 		console.log('click');
	// 	}
	// },
	created: function () {
		var self = this;
		var i = 0;

		window.self = self;

		// var counterInterval = setInterval(function () {
		// 	if (!self.model.counter) clearInterval(counterInterval);
		// 	else self.model.counter--;
		// }, 1000);

		setTimeout(function () {
			for (i; i < 2600; i++) {
				self.model.items.push({ number: self.model.items.length });
			}
			setTimeout(function () {
				for (i; i > 10; i--) {
					self.model.items.pop();
				}
			}, 100);
		}, 1000);

	}
});
