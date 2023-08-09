import { component, html } from './x-element.js';
import highlight from './modules/highlight.js';
import color from './modules/color.js';

const names = [
    'options',
    'dynamic',
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

export default class guide extends component {

    input = 'hello world';
    checked = true;
    color = color();
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
    tag = 'div';

    optionsComponent = `
    export default class c extends component {

        // Optional: Tag name to be used internally for customElement.define and document.createElement. Defaults to class name.
        static tag?: string;

        // Optional: Declarative way to attach shadowRoot to the Component. Defaults to false.
        static shadow?: boolean;

        // Optional: Shadow Mode. Defaults to 'open'
        static mode?: 'open' | 'closed';

        // Optional: limit the properties that will trigger render. Defaults to all.
        static observedProperties?: string[];

        // Conveniences method to handle customElements.define, customElements.upgrade, and returns the Class.
        // Will not error if matching tag name and class is defined.
        // Converts the tag/constructor.name into to an allowed name.
        static define: (tag: string = this.tag ?? this.name) => component;

        // Convenience method to handle customElments.define, createElement, customElments.upgrade, returns a new Instance.
        // Will not error if matching tag name and class is defined.
        // Converts the tag/constructor.name into to an allowed name.
        static create: (tag: string = this.tag ?? this.name) => Element;

        // Convenience method to handle customElments.define, createElement, customElments.upgrade, wati until initial render, and returns a new Instance.
        // Will not error if matching tag name and class is defined.
        // Converts the tag/constructor.name into to an allowed name.
        static async upgrade: (tag: string = this.tag ?? this.name) => Element;

        // Template to render
        render = () => html\`\`;

        // Life Cycle
        created = () => console.log('createdCallback');
        rendered = () => console.log('renderedCallback');
        connected = () => console.log('connectedCallback');
        adopted = () => console.log('adoptedCallback');
        disconnected = () => console.log('disconnectedCallback');
        attribute = () => console.log('attributeChangedCallback');
    }
    `;
    optionsCode = highlight(this.optionsComponent.toString());

    dynamicComponent = () => html`
        <${this.tag}>Hello World</${this.tag}>
        <${'input'} value=${this.tag} oninput=${e => this.tag = e.target.value}></${'input'}>
    `;
    dynamicCode = highlight(this.dynamicComponent.toString());

    inputComponent = () => html`
    <div>${this.input}</div>
    <input value=${this.input} oninput=${e => this.input = e.target.value} />
    `;
    inputCode = highlight(this.inputComponent.toString());

    mapComponent = () => html`
    <ul>
        ${this.fruits.map(fruit => html` <li>${fruit}</li> `)}
    </ul>
    `;
    mapCode = highlight(this.mapComponent.toString());

    checkComponent = () => html`
    <div>${this.checked ? 'Is Checked' : 'Is Not Checked'}</div>
    <input type="checkbox" ${this.checked ? 'checked' : ''} oninput=${e => this.checked = e.target.checked} />
    `;
    checkCode = highlight(this.checkComponent.toString());

    radioComponent = () => html`
    <div>${this.radioShared}</div>
    <input type="radio" name="radio" ${this.radioShared === this.radioOne ? 'checked' : ''} oninput=${() => this.radioShared = 'one'} />
    <input type="radio" name="radio" ${this.radioShared === this.radioTwo ? 'checked' : ''} oninput=${() => this.radioShared = 'two'} />
    `;
    radioCode = highlight(this.radioComponent.toString());

    styleComponent = () => html`
    <div style=${`color: ${this.color}`}>Look at my style</div>
    <button onclick=${() => this.color = color()}>Change Color</button>
    `;
    styleCode = highlight(this.styleComponent.toString());

    classComponent = () => html`
    <div class=${this.active ? 'default class-color' : 'default'}>Look at my class</div>
    <button onclick=${() => this.active = !this.active}>Toggle Class</button>
    `;
    classCode = highlight(this.classComponent.toString());

    fruitsComponent = () => html`
    <div>${this.fruit}</div>
    <select value=${this.fruit} oninput=${(e) => this.fruit = e.target.value}>
        ${this.fruits.map(fruit => html`
            <option value=${fruit} ${this.fruit === fruit ? 'selected' : ''}>${fruit}</option>
        `)}
    </select>
    `;
    fruitsCode = highlight(this.fruitsComponent.toString());

    carsComponent = () => html`
    <div>${this.car}</div>
    <select oninput=${e => this.car = Array.from(e.target.selectedOptions).map(o => o.value)} multiple>
        ${this.cars.map(car => html`
            <option value=${car} ${this.car.includes(car) ? 'selected' : ''}>${car}</option>
        `)}
    </select>
    `;
    carsCode = highlight(this.carsComponent.toString());

    selectBooleanComponent = () => html`
    <div>${this.boolean}</div>
    <select value=${this.boolean} oninput=${e => this.boolean = JSON.parse(e.target.value)}>
        <option value="true">yes</option>
        <option value="false">no</option>
    </select>
    `;
    selectBooleanCode = highlight(this.selectBooleanComponent.toString());

    selectNumberComponent = () => html`
    <div>${this.number}</div>
    <select value=${this.number} oninput=${e => this.number = JSON.parse(e.target.value)}>
        <option value="0">zero</option>
        <option value="1">one</option>
        <option value="2">two</option>
    </select>
    `;
    selectNumberCode = highlight(this.selectNumberComponent.toString());

    connected() { console.log('connected'); };
    disconnected() { console.log('disconnected'); };

    rendered() {
        console.log('rendered');
        for (const name of names) {
            const codeElement = this.querySelector(`#${name}Code`);
            const sourceElement = this.querySelector(`#${name}Source`);
            if (codeElement) {
                const code = this[ `${name}Code` ];
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

    render = () => html`

    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section>
        <h3>Options</h3>
        <pre id="optionsCode"></pre>
    </section>

    <section id="dynamic">
        <h3>Dynamic</h3>
        <p>Safe and efficient Dynamic tag/elements and attributes.</p>
        <pre id="dynamicCode"></pre>
        <pre id="dynamicComponent">${this.dynamicComponent()}</pre>
        <pre id="dynamicSource"></pre>
    </section>

    <section id="input">
        <h3>Input</h3>
        <p>Attributes starting with <code>on</code> will be removed and will set/remove an EventListener.</p>
        <pre id="inputCode"></pre>
        <pre id="inputComponent">${this.inputComponent()}</pre>
        <pre id="inputSource"></pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Dynamic attributes are allowed which can be used to toggle the attribute.</p>
        <pre id="checkCode"></pre>
        <pre id="checkComponent">${this.checkComponent()}</pre>
        <pre id="checkSource"></pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Attribute values will be converted to Strings but set the Element property with the original type.</p>
        <pre id="radioCode"></pre>
        <pre id="radioComponent">${this.radioComponent()}</pre>
        <pre id="radioSource"></pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode"></pre>
        <pre id="classComponent">${this.classComponent()}</pre>
        <pre id="classSource"></pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode"></pre>
        <pre id="styleComponent">${this.styleComponent()}</pre>
        <pre id="styleSource"></pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode"></pre>
        <pre id="mapComponent">${this.mapComponent()}</pre>
        <pre id="mapSource"></pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode"></pre>
        <pre id="fruitsComponent">${this.fruitsComponent()}</pre>
        <pre id="fruitsSource"></pre>

        <br>

        <pre id="carsCode"></pre>
        <pre id="carsComponent">${this.carsComponent()}</pre>
        <pre id="carsSource"></pre>

        <br>

        <pre id="selectBooleanCode"></pre>
        <pre id="selectBooleanComponent">${this.selectBooleanComponent()}</pre>
        <pre id="selectBooleanSource"></pre>

        <br>

        <pre id="selectNumberCode"></pre>
        <pre id="selectNumberComponent">${this.selectNumberComponent()}</pre>
        <pre id="selectNumberSource"></pre>

    </section>

    `;

}