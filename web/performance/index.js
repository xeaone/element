
var oLoop = {
	name: 'o-loop',
	model: {
		items: [
			{ number: 0 },
		]
	},
	created: function () {

		for (var i = 0; i < 1000; i++) {
			this.model.items.push({ number: this.model.items.length });
		}

	},
	template: `
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
