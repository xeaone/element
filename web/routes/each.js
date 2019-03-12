
export default {
	title: 'Each',
	path: '/each',
	component: {
		name: 'r-each',
		model: {
			title: 'Each',
			items: [
				{ it: { val: 0 } },
				{ it: { val: 1 } },
				{ it: { val: 2 } }
			]
		},
		created: function () {
			var self = this;

			setTimeout(function () {
				var increaseInterval = setInterval(function () {

					if (self.model.items.length === 5) {
						console.log('\nPUSH: end\n\n');
						clearInterval(increaseInterval);

						// var decreaseInterval = setInterval(function () {
						// 	if (self.model.items.length === 3) {
						// 		console.log('\nPOP: end\n\n');
						// 		clearInterval(decreaseInterval);
						// 	} else {
						//
						// 		if (self.model.items.length === 6) {
						// 			console.log('\nPOP: start\n\n');
						// 		}
						//
						// 		self.model.items.pop();
						// 		console.log('POP',self.model.items.length);
						// 	}
						// }, 1000);

					} else {

						if (self.model.items.length === 3) {
							console.log('\nPUSH: start\n\n');
						}

						self.model.items.push({ it: { val: self.model.items.length } });
						console.log('PUSH',self.model.items.length);
					}

				}, 1000);
			}, 3000);

		},
		template: /*html*/`

			<h2 o-text="title"></h2>
			<hr>

			<div o-text="items.0.it.val"></div>

			<input type="text" o-value="items.0.it.val">

			<div o-each-item="items">
				<span>
					<span>{{$item}}</span>
					<span o-text="$item.it.val"></span>
					<span>,</span>
				</span>
			</div>

		`
	}
};
