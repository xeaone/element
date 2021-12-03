[![Total alerts](https://img.shields.io/lgtm/alerts/g/vokeio/oxe.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/vokeio/oxe/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/vokeio/oxe.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/vokeio/oxe/context:javascript)

# Oxe
A mighty tiny web components framework/library.

## Project Goal
- Easy learning curve
- Feels like JS and HTML not a framework

## Feature Highlight
- Zero config smart front end routing
- Dynamic ES6/ESM module rewrites (Use ES6 modules in browsers that don't have native support)
- Dynamic Template string rewrites (Use template strings in browsers that don't have native support)

## Polyfill You Might Need
- customElements
- URL, Promise, fetch
- TMLTemplateElement
- Event, CustomEvent

## Browser Support
- IE11~
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android


### Overview
Live examples [vokeio.github.io/oxe/](https://vokeio.github.io/oxe/).

### Install
- `npm i oxe --save`
- UMD `pro/oxe.min.js`

## Component Example
```js
// my-component.js

const { Component } = Oxe;

export default MyComponent extends Component {
    static attributes = []
    adopt = false
    shadow = false
    css = '
    '
    html = `
        <h1>{{title}}</h1>
        <button onclick="{{greet()}}">Greet</button>
    `
    data = {
        greeting: '',
        greet () { this.greeting = 'Hola Mundo'; }
    }
    async adopted () {}
    async attributed () {}
    async disconnected () {}
    async connected () {
        this.data.greeting = 'Hello World';
    }
}
```

## Route Example
```js
// routes/index.js

const { Component } = Oxe;

export default Index extends Component {
    title = 'Index Route'
    description = 'Index Description'
    html = `<my-component></my-component>`
    async connected () {
        console.log('route connected');
    }
}
```

```js
// index.js


await Oxe.define([
    './my-component.js'
]); // or import module and use window.customElements.define();

await Oxe.router.setup({
    target: 'main',
    folder: 'routes'
});
```

```html
<!-- index.html -->
<html>
<head>
    <script src="/oxe.min.js" defer></script>
    <script src="/index.js" defer></script>
</head>
<body>
    <main></main>
</body>
</html>
```

## Author
[vokeio](https://github.com/vokeio)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
