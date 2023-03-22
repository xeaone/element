import { Component, component, html } from './x-element.js';
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
];

const cache = new WeakMap();

export default class Guide extends Component {

    connect() { console.log('connect'); };
    disconnect() { console.log('disconnect'); };

    change(c) {
        console.log('change');
        for (const name of names) {
            const codeElement = this.querySelector(`#${name}Code`);
            const sourceElement = this.querySelector(`#${name}Source`);
            if (codeElement) {
                const code = c[ `${name}Code` ];
                if (cache.get(codeElement) !== code) {
                    cache.set(codeElement, code);
                    codeElement.innerHTML = code;
                }
            }
            if (sourceElement) {
                const componentElement = this.querySelector(`#${name}Component`);
                const source = highlight(componentElement.innerHTML, 'html');
                if (cache.get(sourceElement) !== source) {
                    cache.set(sourceElement, source);
                    sourceElement.innerHTML = source;
                }
            }
        }
    };

    setup (c) {
        console.log('setup');

        c.input = 'hello world';
        c.checked = true;
        c.color = color();
        c.active = true;
        c.radioShared = 'two';
        c.radioOne = 'one';
        c.radioTwo = 'two';
        c.boolean = true;
        c.number = 1;
        c.fruit = 'Orange';
        c.fruits = [ 'Apple', 'Orange', 'Tomato' ];
        c.car = [ 'ford' ];
        c.cars = [ 'tesla', 'ford', 'chevy' ];

        c.cycleComponent = `
        class XC extends Component {

            // Optional: Tag name to be used for customElement.define and document.createElement.
            //           If not defined then the class name will be used for dynamic declarative customElement.define and document.createElement.
            static tag?: string;

            // Optional: Declarative way to define the Component when decoration. Uses the tag name or the class name.
            static define?: boolean;

            // Optional: Declarative way to create shadowRoot and attach to the Component.
            static shadow?: boolean;

            connect () { console.log('connect'); }
            upgrade () { console.log('upgrade'); }
            disconnect () { console.log('disconnect'); }
        }
        `;
        c.cycleCode = highlight(c.cycleComponent.toString());

        c.inputComponent = () => html`
        <div>${c.input}</div>
        <input value=${c.input} oninput=${(e) => c.input = e.target.value} />
        `;
        c.inputCode = highlight(c.inputComponent.toString());

        c.mapComponent = () => html`
        ${c.fruits.map(fruit => html`<div>${fruit}</div>`)}
        `;
        c.mapCode = highlight(c.mapComponent.toString());

        c.checkComponent = () => html`
        <div>${c.checked ? 'Is Checked' : 'Is Not Checked'}</div>
        <input type="checkbox" checked=${c.checked} oninput=${(e) => c.checked = e.target.checked} />
        `;
        c.checkCode = highlight(c.checkComponent.toString());

        c.radioComponent = () => html`
        <div>${c.radioShared}</div>
        <input type="radio" name="radio" checked=${c.radioShared === c.radioOne} oninput=${() => c.radioShared = 'one'} />
        <input type="radio" name="radio" checked=${c.radioShared === c.radioTwo} oninput=${() => c.radioShared = 'two'} />
        `;
        c.radioCode = highlight(c.radioComponent.toString());

        c.styleComponent = () => html`
        <div style=${`color: ${c.color}`}>Look at my style</div>
        <button onclick=${() => c.color = color()}>Change Color</button>
        `;
        c.styleCode = highlight(c.styleComponent.toString());

        c.classComponent = () => html`
        <div class=${c.active ? 'default class-color' : 'default'}>Look at my class</div>
        <button onclick=${() => c.active = !c.active}>Toggle Class</button>
        `;
        c.classCode = highlight(c.classComponent.toString());

        c.fruitsComponent = () => html`
        <div>${c.fruit}</div>
        <select value=${c.fruit} oninput=${(e) => c.fruit = e.target.value}>
            ${c.fruits.map(fruit => html`
                <option value=${fruit} selected=${c.fruit === fruit}>${fruit}</option>
            `)}
        </select>
        `;
        c.fruitsCode = highlight(c.fruitsComponent.toString());

        c.carsComponent = () => html`
        <div>${c.car}</div>
        <select oninput=${(e) => c.car = Array.from(e.target.selectedOptions).map(o => o.value)} multiple>
            ${c.cars.map(car => html`
                <option value=${car} selected=${c.car.includes(car)}>${car}</option>
            `)}
        </select>
        `;
        c.carsCode = highlight(c.carsComponent.toString());

        c.selectBooleanComponent = () => html`
        <div>${c.boolean}</div>
        <select value=${c.boolean} oninput=${(e) => c.boolean = JSON.parse(e.target.value)}>
            <option value="true">yes</option>
            <option value="false">no</option>
        </select>
        `;
        c.selectBooleanCode = highlight(c.selectBooleanComponent.toString());

        c.selectNumberComponent = () => html`
        <div>${c.number}</div>
        <select value=${c.number} oninput=${(e) => c.number = JSON.parse(e.target.value)}>
            <option value="0">zero</option>
            <option value="1">one</option>
            <option value="2">two</option>
        </select>
        `;
        c.selectNumberCode = highlight(c.selectNumberComponent.toString());

    }

    render = (c) => html`

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
        <pre id="inputComponent">${c.inputComponent()}</pre>
        <pre id="inputSource"></pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode"></pre>
        <pre id="mapComponent">${c.mapComponent()}</pre>
        <pre id="mapSource"></pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Boolean html attributes will be treated as Boolean paramters and toggle the attribute.</p>
        <pre id="checkCode"></pre>
        <pre id="checkComponent">${c.checkComponent()}</pre>
        <pre id="checkSource"></pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Boolean html attributes will be treated as Boolean paramters and toggle the attribute.</p>
        <pre id="radioCode"></pre>
        <pre id="radioComponent">${c.radioComponent()}</pre>
        <pre id="radioSource"></pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode"></pre>
        <pre id="classComponent">${c.classComponent()}</pre>
        <pre id="classSource"></pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode"></pre>
        <pre id="styleComponent">${c.styleComponent()}</pre>
        <pre id="styleSource"></pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode"></pre>
        <pre id="fruitsComponent">${c.fruitsComponent()}</pre>
        <pre id="fruitsSource"></pre>

        <br>

        <pre id="carsCode"></pre>
        <pre id="carsComponent">${c.carsComponent()}</pre>
        <pre id="carsSource"></pre>

        <br>

        <pre id="selectBooleanCode"></pre>
        <pre id="selectBooleanComponent">${c.selectBooleanComponent()}</pre>
        <pre id="selectBooleanSource"></pre>

        <br>

        <pre id="selectNumberCode"></pre>
        <pre id="selectNumberComponent">${c.selectNumberComponent()}</pre>
        <pre id="selectNumberSource"></pre>

    </section>

    `

}