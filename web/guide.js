import Highlight from './modules/highlight.js';
import Color from './modules/color.js';

const inputComponenet = (html, c) => html`
    <div>${c.input}</div>
    <input value=${c.input} oninput=${(e) => c.input = e.target.value} />
`;
const inputCode = Highlight(inputComponenet.toString());

const mapComponenet = (html, c) => html`
    ${c.fruits.map(fruit => html`<div>${fruit}</div>`)}
`;
const mapCode = Highlight(mapComponenet.toString());

const checkComponent = (html, c) => html`
    <div>${c.checked ? 'Is Checked' : 'Is Not Checked'}</div>
    <input type="checkbox" checked=${c.checked} oninput=${(e) => c.checked = e.target.checked} >
`;
const checkCode = Highlight(checkComponent.toString());

const radioComponenet = (html, c) => html`
    <div>${c.radioShared}</div>
    <input type="radio" name="radio" checked=${c.radioShared === c.radioOne} oninput=${() => c.radioShared = 'one'} />
    <input type="radio" name="radio" checked=${c.radioShared === c.radioTwo} oninput=${() => c.radioShared = 'two'} />
`;
const radioCode = Highlight(radioComponenet.toString());

const styleComponenet = (html, c) => html`
    <div style="color: ${c.color}">Look at my style</div>
    <button onclick=${() => c.color = Color()}>Change Color</button>
`;
const styleCode = Highlight(styleComponenet.toString());

const classComponenet = (html, c) => html`
    <div class=${c.active ? 'default class-color' : 'default'}>Look at my class</div >
    <button onclick=${() => c.active = !c.active}>Toggle Class</button>
`;
const classCode = Highlight(classComponenet.toString());

const fruitsComponenet = (html, c) => html`
    <div>${c.fruit}</div>
    <select value=${c.fruit} oninput=${(e) => c.fruit = e.target.value}>
        ${c.fruits.map(fruit => html`
            <option value=${fruit}>${fruit}</option>
        `)}
    </select>
`;
const fruitsCode = Highlight(fruitsComponenet.toString());

const carsComponenet = (html, c) => html`
    <div>${c.car}</div>
    <select oninput=${(e) => c.car = Array.from(e.target.selectedOptions).map(o => o.value)}>
        ${c.cars.map(car => html`
            <option value=${car} selected=${c.car.includes(car)}>${car}</option>
        `)}
    </select>
`;
const carsCode = Highlight(carsComponenet.toString());

const selectBooleanComponenet = (html, c) => html`
    <div>${c.boolean}</div>
    <select value=${c.boolean} oninput=${(e) => c.boolean = JSON.parse(e.target.value)}>
        <option value="true">yes</option>
        <option value="false">no</option>
    </select>
`;
const selectBooleanCode = Highlight(selectBooleanComponenet.toString());

const selectNumberComponenet = (html, c) => html`
    <div>${c.number}</div>
    <select value=${c.number} oninput=${(e) => c.number = JSON.parse(e.target.value)}>
        <option value="0">zero</option>
        <option value="1">one</option>
        <option value="2">two</option>
    </select>
`;
const selectNumberCode = Highlight(selectNumberComponenet.toString());

// const htmlComponent = (html) => html`
//     <div>&#x1F480; This is HTML</div >
// `;
// const htmlCode = Highlight(htmlComponent.toString());

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

const contextCode = Highlight(`
const context = () => ({
    connect () { console.log('before connect'); },
    upgrade () { console.log('before upgrade'); },
    upgraded () { console.log('after upgraded'); },
    connected () { console.log('after connected'); },
    disconnect () { console.log('before disconnect'); },
    disconnected () { console.log('after disconnected'); },
});
`);

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

    async connect () {
        console.log('before connect');
        // await new Promise(resolve => setTimeout(()=> resolve(), 2000));
        // let count = 0;
        // let id = setInterval(()=> {
        //     console.log(count);
        //     this.waitOne = count++;
        //     if (count === 50) clearInterval(id);
        // }, 100);
    },
    upgrade () { console.log('before upgrade'); },
    upgraded () { console.log('after upgraded'); },
    connected () {
        console.log('after connected');
        // this.inputHtml = Highlight(document.querySelector('#inputComponent').innerHTML, 'html');
        // this.mapHtml = Highlight(document.querySelector('#mapComponent').innerHTML, 'html');
        // this.checkHtml = Highlight(document.querySelector('#checkComponent').innerHTML, 'html');
        // this.radioHtml = Highlight(document.querySelector('#radioComponent').innerHTML, 'html');
        // this.classHtml = Highlight(document.querySelector('#classComponent').innerHTML, 'html');
        // this.styleHtml = Highlight(document.querySelector('#styleComponent').innerHTML, 'html');
        // this.fruitsHtml = Highlight(document.querySelector('#fruitsComponent').innerHTML, 'html');
        // this.carsHtml = Highlight(document.querySelector('#carsComponent').innerHTML, 'html');
        // this.selectBooleanHtml = Highlight(document.querySelector('#selectBooleanComponent').innerHTML, 'html');
        // this.selectNumberHtml = Highlight(document.querySelector('#selectNumberComponent').innerHTML, 'html');
        // this.htmlHtml = Highlight(document.querySelector('#htmlComponent').innerHTML, 'html');
    },
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
        <pre>${contextCode}</pre>
    </section>

    <section id="input">
        <h3>Input</h3>
        <pre>${inputCode}</pre>
        <pre id="inputComponent">${inputComponenet(html, c)}</pre>
        <pre>${c.inputHtml}</pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre>${mapCode}</pre>
        <pre id="mapComponent">${mapComponenet(html, c)}</pre>
        <pre>${c.mapHtml}</pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Boolean html attributes will treated as Boolean paramters and toggle the attribute.</p>
        <pre>${checkCode}</pre>
        <pre id="checkComponent">${checkComponent(html, c)}</pre>
        <pre>${c.checkHtml}</pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Boolean html attributes will treated as Boolean paramters and toggle the attribute.</p>
        <pre>${radioCode}</pre>
        <pre id="radioComponent">${radioComponenet(html, c)}</pre>
        <pre>${c.radioHtml}</pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre>${classCode}</pre>
        <pre id="classComponent">${classComponenet(html, c)}</pre>
        <pre>${c.classHtml}</pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre>${styleCode}</pre>
        <pre id="styleComponent">${styleComponenet(html, c)}</pre>
        <pre>${c.styleHtml}</pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre>${fruitsCode}</pre>
        <pre id="fruitsComponent">${fruitsComponenet(html, c)}</pre>
        <pre>${c.fruitsHtml}</pre>

        <br>

        <pre>${carsCode}</pre>
        <pre id="carsComponent">${carsComponenet(html, c)}</pre>
        <pre>${c.carsHtml}</pre>

        <br>

        <pre>${selectBooleanCode}</pre>
        <pre id="selectBooleanComponent">${selectBooleanComponenet(html, c)}</pre>
        <pre>${c.selectBooleanHtml}</pre>

        <br>

        <pre>${selectNumberCode}</pre>
        <pre id="selectNumberComponent">${selectNumberComponenet(html, c)}</pre>
        <pre>${c.selectNumberHtml}</pre>

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