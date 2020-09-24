const { Component, Define } = Oxe;

class oLoop extends Component {

    static attributes = [ 'test' ];

    static model = {
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
    }

    static template = /*html*/`

        <slot name="main">Main Default</slot>

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
    // constructor () { super(); }

    attributed () {
        console.log(arguments);
    }

    created () {
        console.log(this.model);
    }

}

Define('o-loop', oLoop);

// Oxe.setup({
//     component: {
//         components: [
//             oLoop
//         ]
//     }
// }).catch(console.error);
