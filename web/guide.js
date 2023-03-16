import { component, html } from './x-element.js';
import highlight from './modules/highlight.js';
import color from './modules/color.js';

const names = [
    'cycle',
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

const cache = new WeakMap();

export default ({ html, s, r }) => (
    console.log(r),
    s.input = 'hello world',
    s.checked = true,
    s.color = color(),
    s.active = true,
    s.radioShared = 'two',
    s.radioOne = 'one',
    s.radioTwo = 'two',
    s.boolean = true,
    s.number = 1,
    s.fruit = 'Orange',
    s.fruits = [ 'Apple', 'Orange', 'Tomato' ],
    s.car = [ 'ford' ],
    s.cars = [ 'tesla', 'ford', 'chevy' ],

    s.connecting = () => { console.log('connecting'); },
    s.upgrading = () => { console.log('upgrading'); },
    s.upgraded = () => {
        console.log('upgraded');
        for (const name of names) {
            const codeElement = r.querySelector(`#${name}Code`);
            const sourceElement = r.querySelector(`#${name}Source`);
            if (codeElement) {
                const code = s[ `${name}Code` ];
                if (cache.get(codeElement) !== code) {
                    cache.set(codeElement, code);
                    codeElement.innerHTML = code;
                }
            }
            if (sourceElement) {
                const componentElement = r.querySelector(`#${name}Component`);
                const source = highlight(componentElement.innerHTML, 'html');
                if (cache.get(sourceElement) !== source) {
                    cache.set(sourceElement, source);
                    sourceElement.innerHTML = source;
                }
            }
        }
    },
    s.connected = () => { console.log('connected'); },
    s.disconnecting = () => { console.log('disconnecting'); },
    s.disconnected = () => { console.log('disconnected'); },

    s.cycleComponent = `
    class XElement extends HTMLElement {

        // Optional: Tag name to be used for customElement.define and document.createElement.
        //           If not defined then the class name will be used for dynamic declarative customElement.define and document.createElement.
        static tag?: string;

        // Optional: Declarative way to define the Component when decoration. Uses the tag name or the class name.
        static define?: boolean;

        // Optional: Declarative way to create shadowRoot and attach to the Component.
        static shadow?: boolean;

        // Optional: Declarative way to observe only specific properties on the Component. Default is a two way observation of all props except the reserved names.
        static observedProperties?: string[];

        connecting () { console.log('connecting'); }
        connected () { console.log('connected'); }

        upgrading () { console.log('upgrading'); }
        upgraded () { console.log('upgraded'); }

        disconnecting () { console.log('disconnecting'); }
        disconnected () { console.log('disconnected'); }
    }
    `,
    s.cycleCode = highlight(s.cycleComponent.toString()),

    s.inputComponent = () => html`
    <div>${s.input}</div>
    <input value=${s.input} oninput=${(e) => s.input = e.target.value} />
    `,
    s.inputCode = highlight(s.inputComponent.toString()),

    s.mapComponent = () => html`
    ${s.fruits.map(fruit => html`<div>${fruit}</div>`)}
    `,
    s.mapCode = highlight(s.mapComponent.toString()),

    s.checkComponent = () => html`
    <div>${s.checked ? 'Is Checked' : 'Is Not Checked'}</div>
    <input type="checkbox" checked=${s.checked} oninput=${(e) => s.checked = e.target.checked} >
    `,
    s.checkCode = highlight(s.checkComponent.toString()),

    s.radioComponent = () => html`
    <div>${s.radioShared}</div>
    <input type="radio" name="radio" checked=${s.radioShared === s.radioOne} oninput=${() => s.radioShared = 'one'} />
    <input type="radio" name="radio" checked=${s.radioShared === s.radioTwo} oninput=${() => s.radioShared = 'two'} />
    `,
    s.radioCode = highlight(s.radioComponent.toString()),

    s.styleComponent = () => html`
    <div style=${`color: ${s.color}`}>Look at my style</div>
    <button onclick=${() => s.color = color()}>Change Color</button>
    `,
    s.styleCode = highlight(s.styleComponent.toString()),

    s.classComponent = () => html`
    <div class=${s.active ? 'default class-color' : 'default'}>Look at my class</div >
    <button onclick=${() => s.active = !s.active}>Toggle Class</button>
    `,
    s.classCode = highlight(s.classComponent.toString()),

    s.fruitsComponent = () => html`
    <div>${s.fruit}</div>
    <select value=${s.fruit} oninput=${(e) => s.fruit = e.target.value}>
        ${s.fruits.map(fruit => html`
            <option value=${fruit} selected=${s.fruit === fruit}>${fruit}</option>
        `)}
    </select>
    `,
    s.fruitsCode = highlight(s.fruitsComponent.toString()),

    s.carsComponent = () => html`
    <div>${s.car}</div>
    <select oninput=${(e) => s.car = Array.from(e.target.selectedOptions).map(o => o.value)} multiple>
        ${s.cars.map(car => html`
            <option value=${car} selected=${s.car.includes(car)}>${car}</option>
        `)}
    </select>
    `,
    s.carsCode = highlight(s.carsComponent.toString()),

    s.selectBooleanComponent = () => html`
    <div>${s.boolean}</div>
    <select value=${s.boolean} oninput=${(e) => s.boolean = JSON.parse(e.target.value)}>
        <option value="true">yes</option>
        <option value="false">no</option>
    </select>
    `,
    s.selectBooleanCode = highlight(s.selectBooleanComponent.toString()),

    s.selectNumberComponent = () => html`
    <div>${s.number}</div>
    <select value=${s.number} oninput=${(e) => s.number = JSON.parse(e.target.value)}>
        <option value="0">zero</option>
        <option value="1">one</option>
        <option value="2">two</option>
    </select>
    `,

    s.selectNumberCode = highlight(s.selectNumberComponent.toString()),

    () => html`

    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section>
        <h3>Life Cycle</h3>
        <pre id="cycleCode"></pre>
    </section>

    <section id="input">
        <h3>Input</h3>
        <pre id="inputCode"></pre>
        <pre id="inputComponent">${s.inputComponent()}</pre>
        <pre id="inputSource"></pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode"></pre>
        <pre id="mapComponent">${s.mapComponent()}</pre>
        <pre id="mapSource"></pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Boolean html attributes will be treated as Boolean paramters and toggle the attribute.</p>
        <pre id="checkCode"></pre>
        <pre id="checkComponent">${s.checkComponent()}</pre>
        <pre id="checkSource"></pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Boolean html attributes will be treated as Boolean paramters and toggle the attribute.</p>
        <pre id="radioCode"></pre>
        <pre id="radioComponent">${s.radioComponent()}</pre>
        <pre id="radioSource"></pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode"></pre>
        <pre id="classComponent">${s.classComponent()}</pre>
        <pre id="classSource"></pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode"></pre>
        <pre id="styleComponent">${s.styleComponent()}</pre>
        <pre id="styleSource"></pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode"></pre>
        <pre id="fruitsComponent">${s.fruitsComponent()}</pre>
        <pre id="fruitsSource"></pre>

        <br>

        <pre id="carsCode"></pre>
        <pre id="carsComponent">${s.carsComponent()}</pre>
        <pre id="carsSource"></pre>

        <br>

        <pre id="selectBooleanCode"></pre>
        <pre id="selectBooleanComponent">${s.selectBooleanComponent()}</pre>
        <pre id="selectBooleanSource"></pre>

        <br>

        <pre id="selectNumberCode"></pre>
        <pre id="selectNumberComponent">${s.selectNumberComponent()}</pre>
        <pre id="selectNumberSource"></pre>

    </section>

`);