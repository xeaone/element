
var oLoop = {
    constructor: function () {
        this.super();
    },
    created: function () {
        console.log(this.model);
    },
    model: {
        items: [],
        message: '',
        count: 1000,
        push: function () {
            console.time('push');

            for (var i = 0; i < this.model.count; i++) {
                this.model.items.push({ number: this.model.items.length });
            }

            console.timeEnd('push');
        },
        overwrite: function () {
            console.time('overwrite');

            var items = [];

            for (var i = 0; i < 10; i++) {
                items.push({ number: i });
            }

            this.model.items = items;

            console.timeEnd('overwrite');
        }
    },
    template: /*html*/`

		<h3><span>{{count}}</span> Inputs two way binded</h3>

		<form o-submit="push">
			<input o-value="count" type="number">
			<input type="submit" value="Push">
		</form>

		<br>

		<button o-on-click="push">Push</button>
		<button o-on-click="overwrite">Overwrite</button>

		<div o-each-item="items">
			<div class="box">
				<div>{{[item].number}}</div>
				<input type="text" o-value="[item].number">
			</div>
		</div>

	`
};

Oxe.Define('o-loop', oLoop);

// Oxe.setup({
//     component: {
//         components: [
//             oLoop
//         ]
//     }
// }).catch(console.error);
