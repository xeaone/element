
var oLoop = {
	name: 'o-loop',
	model: {
		items: [],
		// message: '',
		count: 1000
	},
	methods: {
		loop: function () {
			console.time('push');

			var time = performance.now();

			for (var i = 0; i < this.model.count; i++) {
				this.model.items.push({ number: this.model.items.length });
			}

			console.timeEnd('push')
		},
		over: function () {
			const self = this;

			console.log(self.model.items);
			console.log(self.model.items.length);
			console.time('over');

			var time = performance.now();
			var items = [];

			for (var i = 0; i < 10; i++) {
				items.push({ number: i });
			}

			self.model.items = items;

			console.timeEnd('over')
			console.log(self.model.items);
			console.log(self.model.items.length);

			setTimeout(function () {
				console.log(self.model.items.length);
			}, 3000);
		}
	},
	template: `

		<h3><span o-text="count"></span> Inputs two way binded</h3>
		<h3><span o-text="count"></span> Text one way binded</h3>

		<form o-submit="loop">
			<input o-value="count" type="number">
			<input type="submit" value="Loop">
		</form>

		<!--
		<button o-on-click="over">Over</button>
		-->

		<div o-each-item="items">
			<div class="box">
				<div o-text="item.number"></div>
				<input type="text" o-value="item.number">
			</div>
		</div>
	`,
};

Oxe.setup({
	component: {
		components: [
			oLoop
		]
	}
});
