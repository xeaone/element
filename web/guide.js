import Highlight from './modules/highlight.js';
import Color from './modules/color.js';

const inputComponenet = (html, c) => html`
    <div>${c.input}</div>
    <input value=${c.input} oninput=${(e) => c.input = e.target.value} />
`;

const mapComponenet = (html, c) => html`
    ${c.fruits.map(fruit => html`<div>${fruit}</div>`)}
`;

const checkComponent = (html, c) => html`
    <div>${c.checked ? 'Is Checked' : 'Is Not Checked'}</div>
    <input type="checkbox" checked=${c.checked} oninput=${(e) => c.checked = e.target.checked} >
`;

const radioComponenet = (html, c) => html`
    <div>${c.radioShared}</div>
    <input type="radio" name="radio" checked=${c.radioShared === c.radioOne} oninput=${() => c.radioShared = 'one'} />
    <input type="radio" name="radio" checked=${c.radioShared === c.radioTwo} oninput=${() => c.radioShared = 'two'} />
`;

const styleComponenet = (html, c) => html`
    <div style="color: ${c.color}">Look at my style</div>
    <button onclick=${() => c.color = Color()}>Change Color</button>
`;

const classComponenet = (html, c) => html`
    <div class=${c.active ? 'default class-color' : 'default'}>Look at my class</div >
    <button onclick=${() => c.active = !c.active}>Toggle Class</button>
`;

const fruitsComponenet = (html, c) => html`
    <div>${c.fruit}</div>
    <select value=${c.fruit} oninput=${(e) => c.fruit = e.target.value}>
        ${c.fruits.map(fruit => html`
            <option value=${fruit}>${fruit}</option>
        `)}
    </select>
`;

const carsComponenet = (html, c) => html`
    <div>${c.car}</div>
    <select oninput=${(e) => c.car = Array.from(e.target.selectedOptions).map(o => o.value)}>
        ${c.cars.map(car => html`
            <option value=${car} selected=${c.car.includes(car)}>${car}</option>
        `)}
    </select>
`;

const selectBooleanComponenet = (html, c) => html`
    <div>${c.boolean}</div>
    <select value=${c.boolean} oninput=${(e) => c.boolean = JSON.parse(e.target.value)}>
        <option value="true">yes</option>
        <option value="false">no</option>
    </select>
`;

const selectNumberComponenet = (html, c) => html`
    <div>${c.number}</div>
    <select value=${c.number} oninput=${(e) => c.number = JSON.parse(e.target.value)}>
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

export const component = (html, c) => html`

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
        <pre id="inputComponent">${inputComponenet(html, c)}</pre>
        <pre id="inputSource"></pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode"></pre>
        <pre id="mapComponent">${mapComponenet(html, c)}</pre>
        <pre id="mapSource"></pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Boolean html attributes will treated as Boolean paramters and toggle the attribute.</p>
        <pre id="checkCode"></pre>
        <pre id="checkComponent">${checkComponent(html, c)}</pre>
        <pre id="checkSource"></pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Boolean html attributes will treated as Boolean paramters and toggle the attribute.</p>
        <pre id="radioCode"></pre>
        <pre id="radioComponent">${radioComponenet(html, c)}</pre>
        <pre id="radioSource"></pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode"></pre>
        <pre id="classComponent">${classComponenet(html, c)}</pre>
        <pre id="classSource"></pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode"></pre>
        <pre id="styleComponent">${styleComponenet(html, c)}</pre>
        <pre id="styleSource"></pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode"></pre>
        <pre id="fruitsComponent">${fruitsComponenet(html, c)}</pre>
        <pre id="fruitsSource"></pre>

        <br>

        <pre id="carsCode"></pre>
        <pre id="carsComponent">${carsComponenet(html, c)}</pre>
        <pre id="carsSource"></pre>

        <br>

        <pre id="selectBooleanCode"></pre>
        <pre id="selectBooleanComponent">${selectBooleanComponenet(html, c)}</pre>
        <pre id="selectBooleanSource"></pre>

        <br>

        <pre id="selectNumberCode"></pre>
        <pre id="selectNumberComponent">${selectNumberComponenet(html, c)}</pre>
        <pre id="selectNumberSource"></pre>

    </section>

`;

/*

   <section id="html">
        <h3>HTML</h3>
        <pre>${htmlCode}</pre>
        <pre id="htmlComponent">${htmlComponenet(html, c)}</pre>
        <pre>${c.htmlHtml}</pre>
    </section>

    <section id="routing">
        <h3>Routing</h3>
        <pre>${routeCode}</pre>
    </section>

*/