const { Component } = Oxe;

export default class BinderEachRoute extends Component {

    title = 'Each Binder';

    data = {
        title: 'Each Binder',
        items: [
            { foo: { bar: 'zero' } },
            { foo: { bar: 'one' } }
        ],
        os: {
            keyOne: 'valueOne',
            keyTwo: 'valueTwo',
            keyThree: 'valueThree',
            keyFour: 'valueFour'
        }
    };

    async connected () {

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

    }

    html = /*html*/`

		<h2>{{title}}</h2>
		<hr>

		<div>{{items.0.foo.bar}}</div>
		<input value="{{items.0.foo.bar}}">

		<br>
		<br>
		<strong>Array: each="{{key, index, item of items}}"</strong>
		<div each="{{key, index, item of items}}">
			<div name="{{item.foo.bar}}">
				<strong>Key: </strong>{{key}},
				<strong>Index: </strong>{{index}},
				<strong>Value: </strong>{{item.foo.bar}}
			</div>
		</div>

		<!-- <br>
		<br>
		<strong>Object: o-each-o="os"</strong>
		<div o-each-o="os" o-index="i" o-key="k">
			<div o-name="o" o-on-click="click | o">
				<strong>Index: </strong>{{i}},
				<strong>Key: </strong>{{k}},
                <strong>Value: </strong>{{o}}
			</div>
        </div>

		<br>
		<br>
		<strong>Array: o-each-a="as"</strong>
		<div o-each-a="as" o-index="i" o-key="k">
            <strong>Index: </strong>{{i}},
            <strong>Key: </strong>{{k}},
            <strong>Value: </strong>{{a.it.val}}
            <br>
		</div> -->

    `;

}
