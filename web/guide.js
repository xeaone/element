import { component, html } from './x-element.js';
import Highlight from './modules/highlight.js';
import Color from './modules/color.js';

const inputComponenet = (self) => html`
    <div>${self.input}</div>
    <input value=${self.input} oninput=${(e) => self.input = e.target.value} />
`;

const mapComponenet = (self) => html`
    ${self.fruits.map(fruit => html`<div>${fruit}</div>`)}
`;

const checkComponent = (self) => html`
    <div>${self.checked ? 'Is Checked' : 'Is Not Checked'}</div>
    <input type="checkbox" checked=${self.checked} oninput=${(e) => self.checked = e.target.checked} >
`;

const radioComponenet = (self) => html`
    <div>${self.radioShared}</div>
    <input type="radio" name="radio" checked=${self.radioShared === self.radioOne} oninput=${() => self.radioShared = 'one'} />
    <input type="radio" name="radio" checked=${self.radioShared === self.radioTwo} oninput=${() => self.radioShared = 'two'} />
`;

const styleComponenet = (self) => html`
    <div style=${`color: ${self.color}`}>Look at my style</div>
    <button onclick=${() => self.color = Color()}>Change Color</button>
`;

const classComponenet = (self) => html`
    <div class=${self.active ? 'default class-color' : 'default'}>Look at my class</div >
    <button onclick=${() => self.active = !self.active}>Toggle Class</button>
`;

const fruitsComponenet = (self) => html`
    <div>${self.fruit}</div>
    <select value=${self.fruit} oninput=${(e) => self.fruit = e.target.value}>
        ${self.fruits.map(fruit => html`
            <option value=${fruit} selected=${self.fruit===fruit}>${fruit}</option>
        `)}
    </select>
`;

const carsComponenet = (self) => html`
    <div>${self.car}</div>
    <select oninput=${(e) => self.car = Array.from(e.target.selectedOptions).map(o => o.value)} multiple>
        ${self.cars.map(car => html`
            <option value=${car} selected=${self.car.includes(car)}>${car}</option>
        `)}
    </select>
`;

const selectBooleanComponenet = (self) => html`
    <div>${self.boolean}</div>
    <select value=${self.boolean} oninput=${(e) => self.boolean = JSON.parse(e.target.value)}>
        <option value="true">yes</option>
        <option value="false">no</option>
    </select>
`;

const selectNumberComponenet = (self) => html`
    <div>${self.number}</div>
    <select value=${self.number} oninput=${(e) => self.number = JSON.parse(e.target.value)}>
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
    'security',
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

export default component(class XGuide extends HTMLElement {

    input = 'hello world';
    checked = true;
    color = Color();
    active = true;
    radioShared = 'two';
    radioOne = 'one';
    radioTwo = 'two';
    boolean = true;
    number = 1;
    fruit = 'Orange';
    fruits = [ 'Apple', 'Orange', 'Tomato' ];
    car = [ 'ford' ];
    cars = [ 'tesla', 'ford', 'chevy' ];

    connecting () { console.log('connecting'); }
    upgrading () { console.log('upgrading'); }
    upgraded () {
        console.log('upgraded');
        for (const name of names) {
            const codeElement = this.querySelector(`#${name}Code`);
            const sourceElement = this.querySelector(`#${name}Source`);
            if (codeElement) {
                const code = values[ name ];
                codeElement.innerHTML = code;
            }
            if (sourceElement) {
                const componentElement = this.querySelector(`#${name}Component`);
                const source = Highlight(componentElement.innerHTML, 'html');
                sourceElement.innerHTML = source;
            }
        }
    }
    connected () { console.log('connected'); }
    disconnecting () { console.log('disconnecting'); }
    disconnected () { console.log('disconnected'); }

    template = () => html`

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
            <p>Life cycle methods.</p>
            <pre id="contextCode"></pre>
        </section>

        <section id="input">
            <h3>Input</h3>
            <pre id="inputCode"></pre>
            <pre id="inputComponent">${inputComponenet(this)}</pre>
            <pre id="inputSource"></pre>
        </section>

        <section id="map">
            <h3>Map</h3>
            <pre id="mapCode"></pre>
            <pre id="mapComponent">${mapComponenet(this)}</pre>
            <pre id="mapSource"></pre>
        </section>

        <section id="check">
            <h3>Check</h3>
            <p>Boolean html attributes will be treated as Boolean paramters and toggle the attribute.</p>
            <pre id="checkCode"></pre>
            <pre id="checkComponent">${checkComponent(this)}</pre>
            <pre id="checkSource"></pre>
        </section>

        <section id="radio">
            <h3>Radio</h3>
            <p>Boolean html attributes will be treated as Boolean paramters and toggle the attribute.</p>
            <pre id="radioCode"></pre>
            <pre id="radioComponent">${radioComponenet(this)}</pre>
            <pre id="radioSource"></pre>
        </section>

        <section id="class">
            <h3>Class</h3>
            <pre id="classCode"></pre>
            <pre id="classComponent">${classComponenet(this)}</pre>
            <pre id="classSource"></pre>
        </section>

        <section id="style">
            <h3>Style</h3>
            <pre id="styleCode"></pre>
            <pre id="styleComponent">${styleComponenet(this)}</pre>
            <pre id="styleSource"></pre>
        </section>

        <section id="select">
            <h3>Select</h3>

            <pre id="fruitsCode"></pre>
            <pre id="fruitsComponent">${fruitsComponenet(this)}</pre>
            <pre id="fruitsSource"></pre>

            <br>

            <pre id="carsCode"></pre>
            <pre id="carsComponent">${carsComponenet(this)}</pre>
            <pre id="carsSource"></pre>

            <br>

            <pre id="selectBooleanCode"></pre>
            <pre id="selectBooleanComponent">${selectBooleanComponenet(this)}</pre>
            <pre id="selectBooleanSource"></pre>

            <br>

            <pre id="selectNumberCode"></pre>
            <pre id="selectNumberComponent">${selectNumberComponenet(this)}</pre>
            <pre id="selectNumberSource"></pre>

        </section>

    `;

});
