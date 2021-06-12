const { Component, Define } = Oxe;

class OLoop extends Component {

    static attributes = [ 'test' ];

    data = {
        items: [],
        message: '',
        count: 1000,
        one: { two: 'three' },
        raw () {
            console.time('raw');
            const template = document.createElement('template');
            let html = '';
            for (var i = 0; i < this.count; i++) {
                html += `
                    <div class="box">
                        <div>${i}</div>
                        <input value="${i}">
                    </div>
                `;
            }
            template.innerHTML = html;
            const raw = document.getElementById('raw');
            raw.appendChild(template.content);
            console.timeEnd('raw');
        },
        push () {
            console.log(this);
            console.time('push');

            for (var i = 0; i < this.count; i++) {
                this.items.push({ number: i });
            }

            console.timeEnd('push');
        },
        overwrite () {
            console.time('overwrite');

            var items = [];
            for (var i = 0; i < this.count; i++) {
                items.push({ number: i });
            }

            this.items = items;

            console.timeEnd('overwrite');
        }
    };

    html = /*html*/`

        <slot name="main">Main Default</slot>

        <h3><span>{{count}}</span> Inputs two way bound</h3>
        <input value="{{count}}" type="number">
        <br>
        <button onclick="{{push()}}">push</button>
        <button onclick="{{overwrite()}}">overwrite</button>
        <button onclick="{{raw()}}">raw</button>

        <div each="{{item of items}}">
            <div class="box">
                <div>{{item.number}}</div>
                <input value="{{item.number = $value || item.number}}"></input>
            </div>
        </div>

        <div id="raw"></div>

    `;

    async attributed () {
        console.log(this.data);
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
