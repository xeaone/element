import { render } from '../x-element.js';

const context = () => ({
    items: [ 1, 2 ],
    count: 100000,
    oninput(e) {
        this.count = e?.target?.valueAsNumber;
    },
    push() {
        console.time('push');
        for (var i = 0; i < this.count; i++) this.items.push(i);
        console.timeEnd('push');
    },
    overwrite() {
        console.time('overwrite');
        var items = [];
        for (var i = 0; i < this.count; i++) items.push(i);
        this.items = items;
        console.timeEnd('overwrite');
    },
    clear() {
        this.items = [];
    },
});

const content = (html, c) => html`
    <h2>Count: ${c.count.toLocaleString()}</h2>
    <input type="number" oninput=${c.oninput} value=${c.count}>
    <button onclick=${c.overwrite}>overwrite</button>
    <div>
    ${c.items.map(item => html`<div class="box">${item}</div>`)}
    </div>

    <br/>
    <br/>

    <style>h2{color:red;}</style>
`;

/*
    <script>alert('main')</script>
    <textarea><script>alert('textarea')</script></textarea>

    <span>${9} ${4}</span>
*/

// ${c.items.map(item => html`<div class="box">${item}</div>`)}
// <button onclick=${c.overwrite}>overwrite</button>
// <button onclick=${c.push} >push</button>
// <button onclick=${c.clear}>clear</button>
// <div ${'test'}>at</div>

const root = document.querySelector('main');
render(root, context, content);

