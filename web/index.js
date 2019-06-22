import oSelect from './components/o-select.js';
import cMenu from './components/c-menu.js';
import cFoo from './components/c-foo.js';

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
            cFoo,
            cMenu,
            oSelect
        ]
    },
    router: {
        routes: [
            'index',
            'js',
            'test',
            'select',
            'class',
            'input',
            'style',
            'each',
            '(~)'
        ]
    }
}).catch(console.error);
