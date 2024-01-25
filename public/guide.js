import { html } from './x-element.js';
import highlight from './modules/highlight.js';
import Color from './modules/color.js';

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

let input = 'hello world';
let checked = true;
let color = Color();
let active = true;
let radioShared = 'two';
let radioOne = 'one';
let radioTwo = 'two';
let boolean = true;
let number = 1;
let fruit = 'Orange';
let fruits = [ 'Apple', 'Orange', 'Tomato' ];
let car = [ 'ford' ];
let cars = [ 'tesla', 'ford', 'chevy' ];
let tag = 'div';

// const optionsComponent = `
// export default class c extends component {

//     // Optional: Tag name to be used internally for customElement.define and document.createElement. Defaults to class name.
//     static tag?: string;

//     // Optional: Declarative way to attach shadowRoot to the Component. Defaults to false.
//     static shadow?: boolean;

//     // Optional: Shadow Mode. Defaults to 'open'
//     static mode?: 'open' | 'closed';

//     // Optional: limit the properties that will trigger render. Defaults to all.
//     static observedProperties?: string[];

//     // Conveniences method to handle customElements.define, customElements.upgrade, and returns the Class.
//     // Will not error if matching tag name and class is defined.
//     // Converts the tag/constructor.name into to an allowed name.
//     static define: (tag: string = this.tag ?? this.name) => component;

//     // Convenience method to handle customElments.define, createElement, customElments.upgrade, returns a new Instance.
//     // Will not error if matching tag name and class is defined.
//     // Converts the tag/constructor.name into to an allowed name.
//     static create: (tag: string = this.tag ?? this.name) => Element;

//     // Convenience method to handle customElments.define, createElement, customElments.upgrade, wati until initial render, and returns a new Instance.
//     // Will not error if matching tag name and class is defined.
//     // Converts the tag/constructor.name into to an allowed name.
//     static async upgrade: (tag: string = this.tag ?? this.name) => Element;

//     // Template to render
//     render = () => html\`\`;

//     // Life Cycle
//     created = () => console.log('createdCallback');
//     rendered = () => console.log('renderedCallback');
//     connected = () => console.log('connectedCallback');
//     adopted = () => console.log('adoptedCallback');
//     disconnected = () => console.log('disconnectedCallback');
//     attribute = () => console.log('attributeChangedCallback');
// }
// `;
// const optionsCode = highlight(optionsComponent.toString());

// const dynamicComponent = () => html`
//     <${tag}>Hello World</${tag}>
//     <${'input'} value=${tag} oninput=${e => tag = e.target.value}></${'input'}>
// `;
// const dynamicCode = highlight(dynamicComponent.toString());

const inputComponent = () => html`
<div>${() => input}</div>
<input value=${() => input} oninput=${e => input = e.target.value} />
`;

const checkComponent = () => html`
<div>${() => checked ? 'Is Checked' : 'Is Not Checked'}</div>
<input type="checkbox" ${() => checked ? 'checked' : ''} oninput=${e => checked = e.target.checked} />
`;

const radioComponent = () => html`
<div>${() => radioShared}</div>
<input type="radio" name="radio" ${() => radioShared === radioOne ? 'checked' : ''} oninput=${() => radioShared = 'one'} />
<input type="radio" name="radio" ${() => radioShared === radioTwo ? 'checked' : ''} oninput=${() => radioShared = 'two'} />
`;

const classComponent = () => html`
<div class=${() => active ? 'default class-color' : 'default'}>Look at my class</div>
<button onclick=${() => active = !active}>Toggle Class</button>
`;

const styleComponent = () => html`
<div style=${() => `color: ${color}`}>Look at my style</div>
<button onclick=${() => color = Color()}>Change Color</button>
`;

const mapComponent = () => html`
<ul>
    ${() => fruits.map(fruit => html` <li>${() => fruit}</li> `)}
</ul>
`;

// const fruitsComponent = () => html`
// <div>${fruit}</div>
// <select value=${fruit} oninput=${(e) => fruit = e.target.value}>
//     ${fruits.map(fruit => html`
//         <option value=${fruit} ${fruit === fruit ? 'selected' : ''}>${fruit}</option>
//     `)}
// </select>
// `;
// const fruitsCode = highlight(fruitsComponent.toString());

// const carsComponent = () => html`
// <div>${car}</div>
// <select oninput=${e => car = Array.from(e.target.selectedOptions).map(o => o.value)} multiple>
//     ${cars.map(car => html`
//         <option value=${car} ${car.includes(car) ? 'selected' : ''}>${car}</option>
//     `)}
// </select>
// `;
// const carsCode = highlight(carsComponent.toString());

// const selectBooleanComponent = () => html`
// <div>${boolean}</div>
// <select value=${boolean} oninput=${e => boolean = JSON.parse(e.target.value)}>
//     <option value="true">yes</option>
//     <option value="false">no</option>
// </select>
// `;
// const selectBooleanCode = highlight(selectBooleanComponent.toString());

// const selectNumberComponent = () => html`
// <div>${number}</div>
// <select value=${number} oninput=${e => number = JSON.parse(e.target.value)}>
//     <option value="0">zero</option>
//     <option value="1">one</option>
//     <option value="2">two</option>
// </select>
// `;
// const selectNumberCode = highlight(selectNumberComponent.toString());

// const connected = () => { console.log('connected'); };
// const disconnected = () => { console.log('disconnected'); };

// const rendered = () => {
//     console.log('rendered');
//     for (const name of names) {
//         const codeElement = querySelector(`#${name}Code`);
//         const sourceElement = querySelector(`#${name}Source`);
//         if (codeElement) {
//             const code =  `${name}Code`;
//             if (cache.get(codeElement) !== code) {
//                 cache.set(codeElement, code);
//                 codeElement.innerHTML = code;
//             }
//         }
//         if (sourceElement) {
//             const componentElement = querySelector(`#${name}Component`);
//             const source = highlight(componentElement.innerHTML, 'html');
//             if (cache.get(sourceElement) !== source) {
//                 cache.set(sourceElement, source);
//                 sourceElement.innerHTML = source;
//             }
//         }
//     }
// };

/*
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
        <pre id="dynamicComponent">${dynamicComponent()}</pre>
        <pre id="dynamicSource"></pre>
    </section>

    <section id="input">
        <h3>Input</h3>
        <p>Attributes starting with <code>on</code> will be removed and will set/remove an EventListener.</p>
        <pre id="inputCode"></pre>
        <pre id="inputComponent">${inputComponent()}</pre>
        <pre id="inputSource"></pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Dynamic attributes are allowed which can be used to toggle the attribute.</p>
        <pre id="checkCode"></pre>
        <pre id="checkComponent">${checkComponent()}</pre>
        <pre id="checkSource"></pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Attribute values will be converted to Strings but set the Element property with the original type.</p>
        <pre id="radioCode"></pre>
        <pre id="radioComponent">${radioComponent()}</pre>
        <pre id="radioSource"></pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode"></pre>
        <pre id="classComponent">${classComponent()}</pre>
        <pre id="classSource"></pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode"></pre>
        <pre id="styleComponent">${styleComponent()}</pre>
        <pre id="styleSource"></pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode"></pre>
        <pre id="mapComponent">${mapComponent()}</pre>
        <pre id="mapSource"></pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode"></pre>
        <pre id="fruitsComponent">${fruitsComponent()}</pre>
        <pre id="fruitsSource"></pre>

        <br>

        <pre id="carsCode"></pre>
        <pre id="carsComponent">${carsComponent()}</pre>
        <pre id="carsSource"></pre>

        <br>

        <pre id="selectBooleanCode"></pre>
        <pre id="selectBooleanComponent">${selectBooleanComponent()}</pre>
        <pre id="selectBooleanSource"></pre>

        <br>

        <pre id="selectNumberCode"></pre>
        <pre id="selectNumberComponent">${selectNumberComponent()}</pre>
        <pre id="selectNumberSource"></pre>

    </section>

*/

export default html`

    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section id="input">
        <h3>Input</h3>
        <p>Attributes starting with <code>on</code> will be removed and will set/remove an EventListener.</p>
        <pre id="inputCode">${highlight(inputComponent.toString())}</pre>
        <pre id="inputComponent">${inputComponent()}</pre>
        <pre id="inputSource">${({ query }) => highlight(query('#inputComponent'), 'html')}</pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Dynamic attributes are allowed which can be used to toggle the attribute.</p>
        <pre id="checkCode">${highlight(checkComponent.toString())}</pre>
        <pre id="checkComponent">${checkComponent()}</pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode">${highlight(classComponent.toString())}</pre>
        <pre id="classComponent">${classComponent()}</pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode">${highlight(styleComponent.toString())}</pre>
        <pre id="styleComponent">${styleComponent()}</pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Attribute values will be converted to Strings but set the Element property with the original type.</p>
        <pre id="radioCode">${highlight(radioComponent.toString())}</pre>
        <pre id="radioComponent">${radioComponent()}</pre>
    </section>



`('main');

/*
        <pre id="checkSource">${() => highlight(checkComponent(), 'html')}</pre>
        <pre id="classSource">${() => highlight(classComponent(), 'html')}</pre>
        <pre id="styleSource">${() => highlight(styleComponent(), 'html')}</pre>
        <pre id="radioSource">${() => highlight(radioComponent(), 'html')}</pre>

    <section>
        <h3>Options</h3>
        <pre id="optionsCode"></pre>
    </section>
*/
