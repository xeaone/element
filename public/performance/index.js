import { component, html } from '../x-element.js';

class performance extends component {
    items = [1, 2];
    count = 100000;
    tag = 'strong';

    date = new Date();

    oninput(e) {
        this.count = e?.target?.valueAsNumber;
    }

    push() {
        console.time('push');
        for (var i = 0; i < this.count; i++) this.items.push(i);
        console.timeEnd('push');
    }

    overwrite() {
        console.time('overwrite');
        var items = [];
        for (var i = 0; i < this.count; i++) items.push(i);
        this.items = items;
        console.timeEnd('overwrite');
    }

    increment() {
        console.time('increment');
        for (var i = 0; i < this.items.length; i++) this.items[i]++;
        console.timeEnd('increment');
    }

    clear() {
        this.items = [];
    }

    render = () =>
        html`
        <h2>Count: ${this.count.toLocaleString()}</h2>
        <input type="number" oninput=${(e) => this.oninput(e)} value=${this.count} />
        <button onclick=${this.overwrite}>overwrite</button>
        <button onclick=${this.increment}>increment</button>

        <div>
        ${this.items.map((item) => html`<div class="box">${item}</div>`)}
        </div>

        <${this.tag} foo="test" onclick=${() => console.log(this.tag = 'div')} >
            ${this.count}
        </${this.tag}>

        <div>${this.date.toLocaleString()}</div>
        <div>${this.date.toLocaleString === this.date.toLocaleString}</div>

    `;
}

performance.define();

const main = document.querySelector('main');
main.replaceChildren(new performance());
