[![Total alerts](https://img.shields.io/lgtm/alerts/g/xeaone/element.svg?logo=lgtm&logoWidth=20)](https://lgtm.com/projects/g/xeaone/element/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/xeaone/element.svg?logo=lgtm&logoWidth=20)](https://lgtm.com/projects/g/xeaone/element/context:javascript)

# X-Element

### X-Element's vision is to provide an agnostic non framework that enhances custom elements with functionality and data binding that mimics native custom element standards.


## Features

- &#128118; Simple to learn if you know custom elements you know X-Element.

- &#128230; Shareable A single class to build a single component or an entire app.

- &#9889; Fast Tiny footprint ~15KB (minified and compressed).

- &#127959; Framework Agnostic Use X-Element with any framework - React, Vue, Angular...


## Learn
[https://xeaone.github.io/element/](https://xeaone.github.io/element/)


## Example
```js
import XElement from '/x-element.js';

MyElement extends XElement {

    static observedProperties = ['greeting','greet']

    greeting: '',
    greet () { this.greeting = 'Hello World'; }

    constructor () {
        super();
        this.greeting = 'Hello World';
        this.shadowRoot.innerHTML = `
            <h1>{{title}}</h1>
            <button onclick="{{greet()}}">Greet</button>;
        `;
    }

}

MyElement.define();
```


## Use
[https://cdn.jsdelivr.net/gh/xeaone/element/pro/x-router.js](https://cdn.jsdelivr.net/gh/xeaone/element/pro/x-router.js)

[https://cdn.jsdelivr.net/gh/xeaone/element/pro/x-element.js](https://cdn.jsdelivr.net/gh/xeaone/element/pro/x-element.js)

Originally called Oxe and still available on the [oxe branch](https://github.com/xeaone/element/tree/oxe)


## Author
[xeaone](https://github.com/xeaone)


## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
