<!-- ![check workflow](https://github.com/xeaone/element/actions/workflows/check.yml/badge.svg) -->

# X-Element

### Reactivity without the complexity.

## Vision
Provide a knowledge transferable future proof, reactive data binding, library for building web interfaces.

## Features
- &#128118; **Simple** If you know HTML, JS, and Template Literals then you know XElement.

- &#9981; **Agnostic** Use XElement with any framework or library - Lit, Vue, React, Angular..

- &#9883; **Reactive** Performant and efficient two way reactive data binding.

- &#9889; **Fast** Rendering is blazing fast, because XElement only interacts with the dynamic DOM Nodes..


<!-- - &#129517; **Router** Client side routing using the new [Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api/) -->

## Learn
[https://xeaone.github.io/element/](https://xeaone.github.io/element/)

## Examples

```js
import { html } from 'https://esm.sh/@xeaone/element/module/index.js';

let count = 0;

export default () => html`
    <strong>${() => `Hello World ${count}`}</strong>
    <button onclick=${() => count++}>Greet</button>
`(document.body);
```


## Custom Element
```js
import { html } from 'https://esm.sh/@xeaone/element/module/index.js';

const {html} = await import('https://esm.sh/@xeaone/element/module/index.js')

export default class extends HTMLElement {
    #root = this.attachShadow({ mode: "open" });
    #count = 0;
    #render = () => html`
        <strong>${() => `Hello World ${this.#count}`}</strong>
        <button onclick=${() => this.#count++}>Greet</button>
    `(this.#root);
    constructor() {
        super();
        this.#render();
    }
}
```


## Use
The two directories to use are `module` and `bundle`. Bundle includes ESNext and ES2015 js bundles. Module contains ESM files with `.js, .ts, and .d.ts`.

## NPM
```
npm install @xeaone/element
```
<!-- deno add @xeaone/element -->

## CDN
[https://www.npmjs.com/package/@xeaone/element](https://www.npmjs.com/package/@xeaone/element)

[https://esm.sh/@xeaone/element/module/index.ts](https://esm.sh/@xeaone/element/module/index.ts)
[https://esm.sh/@xeaone/element/module/index.js](https://esm.sh/@xeaone/element/module/index.js)

[https://cdn.jsdelivr.net/gh/xeaone/element/module/index.ts](https://cdn.jsdelivr.net/gh/xeaone/element/module/index.ts)
[https://cdn.jsdelivr.net/gh/xeaone/element/module/index.js](https://cdn.jsdelivr.net/gh/xeaone/element/module/index.js)


## Author
[xeaone](https://github.com/xeaone)


## License
This project is licensed under the MPL-2.0 License
