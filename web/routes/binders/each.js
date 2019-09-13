
export default {
    title: 'Each',
    path: '/each',
    component: {
        name: 'r-each',
        model: {
            title: 'Each',
            as: [
                { it: { val: 0 } }, { it: { val: 1 } }
            ],
            os: {
                keyOne: 'valueOne',
                keyTwo: 'valueTwo',
                keyThree: 'valueThree',
                keyFour: 'valueFour'
            }
        },
        methods: {
            click: function () {
                console.log(arguments);
            }
        },
        created: function () {

            // setTimeout(function () {
            // 	var increaseInterval = setInterval(function () {
            //
            // 		if (self.model.items.length === 20) {
            // 			clearInterval(increaseInterval);
            //
            // 			var decreaseInterval = setInterval(function () {
            // 				if (self.model.items.length === 10) {
            // 					clearInterval(decreaseInterval);
            // 				} else {
            // 					self.model.items.pop();
            // 				}
            // 			}, 50);
            //
            // 		} else {
            // 			self.model.items.push({ it: { val: self.model.items.length } });
            // 		}
            //
            // 	}, 50);
            // }, 3000);

        },
        template: /*html*/`

			<h2>{{title}}</h2>
			<hr>

			<div o-text="as.0.it.val"></div>
			<input type="text" o-value="as.0.it.val">

			<br>
			<br>
			<strong>Array</strong>
			<div o-each-a="as">
				<div>
					<span>Key: {{$a.$key}},</span>
					<span>Index: {{$a.$index}},</span>
					<span>Value: {{$a.it.val}}</span>
				</div>
			</div>

			<br>
			<br>
			<strong>Object</strong>
			<div o-each-o="os">
				<div o-on-click="click | $o">
					<span>Key: {{$o.$key}},</span>
					<span>Index: {{$o.$index}},</span>
					<span>Value: {{$o}}</span>
				</div>
			</div>

		`
    }
};
