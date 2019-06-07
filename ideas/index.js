import oSelect from './components/o-select.js';
import cMenu from './components/c-menu.js';
import cFoo from './components/c-foo.js';

// import Index from './index.js';

document.head.insertAdjacentHTML('afterbegin', /*html*/`

	<meta charset="utf-8" />
	<meta name="theme-color" content="darkorange" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />

	<meta name="keywords" content="oxe, tiny, web, components, framework, library" />
	<meta name="description" content="A mighty tiny web components framework/library" />

	<title>Oxe</title>

	<link rel="stylesheet" href="/index.css" />
`);

document.body.insertAdjacentHTML('afterbegin', /*html*/`
	<div class="title">
		<h1><span>O</span>xe</h1>
		<h2>A mighty tiny web components framework/library</h2>
	</div>

	<div class="menu">
		<a href="./">Home</a>
		<a href="./performance" o-external>Performance</a>
		<div class="menu-item">
			<div class="menu-item-button">
				<a>Examples</a>
			</div>
			<div class="menu-item-content">
				<a href="./test">Test</a>
				<a href="./class">Class</a>
				<a href="./input">Input</a>
				<a href="./style">Style</a>
				<a href="./select">Select</a>
				<a href="./each">Each</a>
			</div>
		</div>
	</div>
`);

Oxe.setup({
    loader: {
        type: 'es'
    },
    fetcher: {
        request: function () {
            console.log(arguments);
        },
        response: function () {
            console.log(arguments);
        }
    },
    component: {
        components: [
            // Index,
            cFoo,
            cMenu,
            oSelect
        ]
    }
}).catch(console.error);
