<!-- ![check workflow](https://github.com/xeaone/element/actions/workflows/check.yml/badge.svg) -->

# X-Element

### A zero knowledge curve, agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element and language standards.

## Features
- &#128118; **Simple** If you know HTML, JS, and Template Literals then you know how to use X-Element

- &#9981; **Agnostic** Use XElement with any framework or library - Lit, Vue, React, Angular.

- &#9883; **Reactive** Efficient two way reactive databinding by default.

- &#9889; **Fast** Rendering is blazing fast, because XElement only interacts with the dynamic DOM Nodes.

- &#128230; **Small** ~(15)KB minified.

- &#129517; **Router** Client side routing using the new [Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api/)

## Learn
[https://xeaone.github.io/element/](https://xeaone.github.io/element/)

## Example
```js
import { component, html } from '/x-element.js';

export default class greet extends component {

    greeting = 'Default Greeting';
    greet = () => this.greeting = 'Updated Greeting';

    render = () => html`
        <h1>this.greeting</h1>
        <button onclick=${this.greet}>Greet</button>
    `;

}
```

## Use
The two directories to use are `module` and `bundle`. Bundle includes ESNext and ES2015 js bundles. Module contains ESM files with `.js, .ts, and .d.ts`.

[https://www.npmjs.com/package/@xeaone/element](https://www.npmjs.com/package/@xeaone/element)

[https://esm.sh/@xeaone/element/module/index.ts](https://esm.sh/@xeaone/element/module/index.ts)
[https://esm.sh/@xeaone/element/module/index.js](https://esm.sh/@xeaone/element/module/index.js)

[https://cdn.jsdelivr.net/gh/xeaone/element/module/index.ts](https://cdn.jsdelivr.net/gh/xeaone/element/module/index.ts)
[https://cdn.jsdelivr.net/gh/xeaone/element/module/index.js](https://cdn.jsdelivr.net/gh/xeaone/element/module/index.js)


## Author
[xeaone](https://github.com/xeaone)


## License
This project is licensed under the MPL-2.0 License
