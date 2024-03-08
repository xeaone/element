import { html, update } from '../source/index.ts';

const token = () => Math.random().toString(36).substring(2, 5);

const items = Array.from({ length: 500 }, (_, index) => ({ name: token(), id: index }));

const rename = () => {
    items.forEach((item) => item.name = token());
    update().then(() => setTimeout(() => rename(), 10));
    // await update();
    // setTimeout(() => rename(), 10);
};

export default html`
    <style>
        .items {
            box-sizing: border-box;
            display: flex;
            flex-wrap: wrap;
            padding: 0;
            margin: 0;
        }
        .item {
            display: block;
            width: 10%;
            padding: 5px;
            box-sizing: border-box;
            border: 1px solid lightgray;
        }
    </style>
    <section onTimeout=${() => rename()}>
        <h1>Performance</h1>
        <div class="items">${() => items.map((item) => html`<span class="item">${() => item.name}</span>`)}</div>
    </section>
`('main');
