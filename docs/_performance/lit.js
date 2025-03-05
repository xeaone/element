import { html, LitElement } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
// import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@2.4.0/index.js';

class LitTest extends LitElement {
    static properties = {
        items: { type: Array },
        count: { type: Number },
    };

    constructor() {
        super();
        this.items = [];
        this.count = 100000;
    }

    oninput(e) {
        this.count = e?.target?.valueAsNumber;
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
        this.requestUpdate();
        console.timeEnd('increment');
    }

    render() {
        const t = html`
            <link rel="stylesheet" href="./index.css">
            <h2>Count: ${this.count.toLocaleString()}</h2>
            <input type="number" @input=${this.oninput} value=${this.count}>
            <button @click=${this.overwrite}>overwrite</button>
            <button @click=${this.increment}>increment</button>
            <div>${this.items.map((item) => html`<div class="box">${item}</div>`)}</div>
        `;

        console.log(t);

        return t;
    }
}

// <button onclick=${c.push} >push</button>
// <button onclick=${c.clear}>clear</button>

customElements.define('lit-test', LitTest);
