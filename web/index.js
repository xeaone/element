
Oxe.router.setup({
    target: 'main',
    folder: 'routes',
    before: () => console.log('router before'),
    after: () => console.log('router after')
});

Oxe.fetcher.setup({
    before: () => console.log('fetcher before'),
    after: () => console.log('fetcher after')
});

window.addEventListener('oroute', (event) => console.log(event));

// Oxe.define([
//     './components/c-foo.js',
//     './components/c-menu.js',
//     './components/o-select.js'
// ]);

