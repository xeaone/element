const { Component, Define } = Oxe;

class OLoop extends Component {

    static attributes = [ 'test' ];

    data = {
        items: [],
        message: '',
        count: 1000,
        raw () {
            console.log('raw');
            console.time('raw');
            const template = document.createElement('template');
            let html = '';
            for (var i = 0; i < this.data.count; i++) {
                html += `
                    <div class="box">
                        <div>${i}</div>
                    </div>
                `;
            }
            template.innerHTML = html;
            const raw = document.getElementById('raw');
            raw.appendChild(template.content);
            console.timeEnd('raw');
        },
        push () {
            console.time('push');

            for (var i = 0; i < this.data.count; i++) this.data.items.push({ number: i });

            console.timeEnd('push');

        },
        overwrite () {
            console.time('overwrite');

            var items = [];
            for (var i = 0; i < 10; i++) items.push({ number: i });
            this.data.items = items;

            console.timeEnd('overwrite');
        }
    };

    html = /*html*/`

        <slot name="main">Main Default</slot>

        <h3><span>{{count}}</span> Inputs two way bound</h3>

        <form onsubmit="{{push()}}">
            <input value="{{count}}" type="number">
            <input type="submit" value="Push">
        </form>

        <br>

        <button onclick="{{raw()}}">raw</button>
        <button onclick="{{push()}}">Push</button>
        <button onclick="{{overwrite()}}">Overwrite</button>

        <div each="{{item of items}}">
            <div class="box">
                <div>{{item.number}}</div>
            </div>
        </div>

        <div id="raw">
        </div>

    `;

    async attributed () {
        console.log(arguments);
    }

    async connected () {
        console.log('connected');
    }

}
// <input value="{{item.number}}"></input>

Define(OLoop);
// Define('o-loop', oLoop);

// Oxe.setup({
//     component: {
//         components: [
//             oLoop
//         ]
//     }
// }).catch(console.error);
