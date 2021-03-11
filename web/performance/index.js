const { Component, Define } = Oxe;

class OLoop extends Component {

    static attributes = ['test'];

    data = {
        items: [],
        message: '',
        count: 1000,
        push() {
            console.time('push');

            for (var i = 0; i < this.data.count; i++) {
                this.data.items.push({ number: i });
            }

            console.timeEnd('push');
        },
        overwrite() {
            console.time('overwrite');

            var items = [];
            for (var i = 0; i < 10; i++) {
                items.push({ number: i });
            }

            this.data.items = items;

            console.timeEnd('overwrite');
        }
    }

    html = /*html*/`

        <slot name="main">Main Default</slot>

        <h3><span>{{count}}</span> Inputs two way binded</h3>

        <form onsubmit="{{push}}">
            <input value="{{count}}" type="number">
            <input type="submit" value="Push">
        </form>

        <br>

        <button onclick="{{push}}">Push</button>
        <button onclick="{{overwrite}}">Overwrite</button>

        <div each="{{item of items}}">
            <div class="box">
                <div>{{item.number}}</div>
                <input value="{{item.number}}">
            </div>
        </div>

    `

    async attributed() {
        console.log(arguments);
    }

    async connected() {
        console.log('connected');
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
