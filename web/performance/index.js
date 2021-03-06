const { Component, Define } = Oxe;

class OLoop extends Component {

    static attributes = ['test'];

    static model = {
        items: [],
        message: '',
        count: 1000,
        push: function () {
            console.time('push');

            for (var i = 0; i < this.model.count; i++) {
                this.model.items.push({ number: i });
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

        <form onsubmit="{{push}}">
            <input value="{{count}}" type="number">
            <input type="submit" value="Push">
        </form>

        <br>

        <button onclick="{{push}}">Push</button>
        <button onclick="{{overwrite}}">Overwrite</button>

        <!--
        <div each-item="items" for="item" of="items">
            <div class="box">
                <div>{{item.number}}</div>
                <input value="{{item.number}}">
            </div>
        </div>
        -->

    `
    // constructor () { super(); }

    static attributed() {
        console.log(arguments);
    }

    static created() {
        console.log(this);
        console.log(this.model);
    }

}

Define(OLoop);
// Define('o-loop', oLoop);

// Oxe.setup({
//     component: {
//         components: [
//             oLoop
//         ]
//     }
// }).catch(console.error);
