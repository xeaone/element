
var oLoop = {
	name: 'o-loop',
	model: {
		items: [],
		message: '',
		count: 1500
	},
	created: function () {
		this.model.message = 'push started';

		let time = performance.now();

		for (var i = 0; i < this.model.count; i++) {
			this.model.items.push({ number: i });
		}

		this.model.message = 'push ended ' + (performance.now() - time) + 'ms';
	},
	template: `

		<h3><span o-text="count"></span> Inputs two way binded</h3>
		<h3><span o-text="count"></span> Text one way binded</h3>

		<h3 o-text="message"></h3>

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
