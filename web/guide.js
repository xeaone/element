import Highlight from './modules/highlight.js';
import Color from './modules/color.js';

const inputComponenet = (html, ctx) => html`
    <div>${ctx.input}</div>
    <input value=${ctx.input} oninput=${(e) => ctx.input = e.target.value} />
`;

const mapComponenet = (html, ctx) => html`
    ${ctx.fruits.map(fruit => html`<div>${fruit}</div>`)}
`;

const checkComponent = (html, ctx) => html`
    <div>${ctx.checked ? 'Is Checked' : 'Is Not Checked'}</div>
    <input type="checkbox" checked=${ctx.checked} oninput=${(e) => ctx.checked = e.target.checked} >
`;

const radioComponenet = (html, ctx) => html`
    <div>${ctx.radioShared}</div>
    <input type="radio" name="radio" checked=${ctx.radioShared === ctx.radioOne} oninput=${() => ctx.radioShared = 'one'} />
    <input type="radio" name="radio" checked=${ctx.radioShared === ctx.radioTwo} oninput=${() => ctx.radioShared = 'two'} />
`;

const styleComponenet = (html, ctx) => html`
    <div style="color: ${ctx.color}">Look at my style</div>
    <button onclick=${() => ctx.color = Color()}>Change Color</button>
`;

const classComponenet = (html, ctx) => html`
    <div class=${ctx.active ? 'default class-color' : 'default'}>Look at my class</div >
    <button onclick=${() => ctx.active = !ctx.active}>Toggle Class</button>
`;

const fruitsComponenet = (html, ctx) => html`
    <div>${ctx.fruit}</div>
    <select value=${ctx.fruit} oninput=${(e) => ctx.fruit = e.target.value}>
        ${ctx.fruits.map(fruit => html`
            <option value=${fruit}>${fruit}</option>
        `)}
    </select>
`;

const carsComponenet = (html, ctx) => html`
    <div>${ctx.car}</div>
    <select oninput=${(e) => ctx.car = Array.from(e.target.selectedOptions).map(o => o.value)}>
        ${ctx.cars.map(car => html`
            <option value=${car} selected=${ctx.car.includes(car)}>${car}</option>
        `)}
    </select>
`;

const selectBooleanComponenet = (html, ctx) => html`
    <div>${ctx.boolean}</div>
    <select value=${ctx.boolean} oninput=${(e) => ctx.boolean = JSON.parse(e.target.value)}>
        <option value="true">yes</option>
        <option value="false">no</option>
    </select>
`;

const selectNumberComponenet = (html, ctx) => html`
    <div>${ctx.number}</div>
    <select value=${ctx.number} oninput=${(e) => ctx.number = JSON.parse(e.target.value)}>
        <option value="0">zero</option>
        <option value="1">one</option>
        <option value="2">two</option>
    </select>
`;

const routeCode = Highlight(`;
import { Router } from './x-element.js';

const main = document.querySelector('main');

const RootContext = () => ({
    title: 'Root Route'
});

const RootComponent = ({ h1 }, { title }) => [
    h1(title)
];

Router('/', main, RootComponent, RootContext);
`);

const contextCode = `
const context = () => ({
    connect () { console.log('before connect'); },
    upgrade () { console.log('before upgrade'); },
    upgraded () { console.log('after upgraded'); },
    connected () { console.log('after connected'); },
    disconnect () { console.log('before disconnect'); },
    disconnected () { console.log('after disconnected'); },
});
`;

const names = [
    'context',
    'input',
    'map',
    'check',
    'radio',
    'class',
    'style',
    'fruits',
    'cars',
    'selectBoolean',
    'selectNumber',
];

const values = {
    context: Highlight(contextCode),
    input: Highlight(inputComponenet.toString()),
    map: Highlight(mapComponenet.toString()),
    check: Highlight(checkComponent.toString()),
    radio: Highlight(radioComponenet.toString()),
    style: Highlight(styleComponenet.toString()),
    class: Highlight(classComponenet.toString()),
    fruits: Highlight(fruitsComponenet.toString()),
    cars: Highlight(carsComponenet.toString()),
    selectBoolean: Highlight(selectBooleanComponenet.toString()),
    selectNumber: Highlight(selectNumberComponenet.toString()),
};

export const context = () => ({

    input: 'hello world',
    checked: true,
    color: Color(),
    active: true,
    radioShared: 'two',
    radioOne: 'one',
    radioTwo: 'two',
    boolean: true,
    number: 1,
    fruit: 'Orange',
    fruits: [ 'Apple', 'Orange', 'Tomato' ],
    car: [ 'ford' ],
    cars: [ 'tesla', 'ford', 'chevy' ],

    async connect () { console.log('before connect'); },
    upgrade () { console.log('before upgrade'); },
    upgraded () {
        console.log('after upgraded');
        for (const name of names) {
            const codeElement = document.querySelector(`#${name}Code`);
            const sourceElement = document.querySelector(`#${name}Source`);
            if (codeElement) {
                const code = values[ name ];
                codeElement.innerHTML = code;
            }
            if (sourceElement) {
                const componentElement = document.querySelector(`#${name}Component`);
                const source = Highlight(componentElement.innerHTML, 'html');
                sourceElement.innerHTML = source;
            }
        }
    },
    connected () { console.log('after connected'); },
    disconnect () { console.log('before disconnect'); },
    disconnected () { console.log('after disconnected'); },
});

export const component = (html, ctx) => html`

    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section>
        <h3>Context</h3>
        <pre id="contextCode"></pre>
    </section>

    <section id="input">
        <h3>Input</h3>
        <pre id="inputCode"></pre>
        <pre id="inputComponent">${inputComponenet(html, ctx)}</pre>
        <pre id="inputSource"></pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode"></pre>
        <pre id="mapComponent">${mapComponenet(html, ctx)}</pre>
        <pre id="mapSource"></pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Boolean html attributes will treated as Boolean paramters and toggle the attribute.</p>
        <pre id="checkCode"></pre>
        <pre id="checkComponent">${checkComponent(html, ctx)}</pre>
        <pre id="checkSource"></pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Boolean html attributes will treated as Boolean paramters and toggle the attribute.</p>
        <pre id="radioCode"></pre>
        <pre id="radioComponent">${radioComponenet(html, ctx)}</pre>
        <pre id="radioSource"></pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode"></pre>
        <pre id="classComponent">${classComponenet(html, ctx)}</pre>
        <pre id="classSource"></pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode"></pre>
        <pre id="styleComponent">${styleComponenet(html, ctx)}</pre>
        <pre id="styleSource"></pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode"></pre>
        <pre id="fruitsComponent">${fruitsComponenet(html, ctx)}</pre>
        <pre id="fruitsSource"></pre>

        <br>

        <pre id="carsCode"></pre>
        <pre id="carsComponent">${carsComponenet(html, ctx)}</pre>
        <pre id="carsSource"></pre>

        <br>

        <pre id="selectBooleanCode"></pre>
        <pre id="selectBooleanComponent">${selectBooleanComponenet(html, ctx)}</pre>
        <pre id="selectBooleanSource"></pre>

        <br>

        <pre id="selectNumberCode"></pre>
        <pre id="selectNumberComponent">${selectNumberComponenet(html, ctx)}</pre>
        <pre id="selectNumberSource"></pre>

    </section>

`;

/*

   <section id="html">
        <h3>HTML</h3>
        <pre>${htmlCode}</pre>
        <pre id="htmlComponent">${htmlComponenet(html, ctx)}</pre>
        <pre>${ctx.htmlHtml}</pre>
    </section>

    <section id="routing">
        <h3>Routing</h3>
        <pre>${routeCode}</pre>
    </section>

*/