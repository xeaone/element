
// Oxe.router.on('route:after', function () {
//     console.log('route:after');
// });

Oxe.location.listen({
    target: 'main',
    folder: 'routes'
});

// Oxe.router.setup({
//     // mode: 'href',
//     routes: [
//         'index',
//         'test',
//         'binders/each',
//         'binders/class',
//         'binders/select',
//         'binders/style',
//         'binders/text',
//         'binders/value',
//         '(~)'
//     ]
// });

// Oxe.setup({
//     fetcher: {
//         request: function () {
//             console.log(arguments);
//         },
//         response: function () {
//             console.log(arguments);
//         }
//     },
//     component: {
//         components: [
//             './components/c-foo.js',
//             './components/c-menu.js',
//             './components/o-select.js'
//         ]
//     },
//     router: {
//         // mode: 'href',
//         routes: [
//             'index',
//             'test',
//             'binders/each',
//             'binders/class',
//             'binders/select',
//             'binders/style',
//             'binders/text',
//             'binders/value',
//             'binders/bool',
//             'any'
//         ]
//     }
// }).catch(console.error);

