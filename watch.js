import typescript from '@rollup/plugin-typescript';
import * as rollup from 'rollup';

await (await rollup.rollup({
    input: './src/element/element.ts',
    plugins: [ typescript({ tsconfig: './tsconfig.json' }) ]
})).write({
    name: 'XElement',
    file: './web/x-element.js',
    format: 'esm',
    indent: '\t',
});

// await (await rollup.rollup({
//     input: './src/router/router.ts',
//     plugins: [ typescript({ tsconfig: './tsconfig.json' }) ]
// })).write({
//     name: 'XRouter',
//     file: './web/x-router.js',
//     format: 'esm',
//     indent: '\t',
// });

const watcher = rollup.watch([
    {
        input: 'src/element/element.ts',
        output: {
            name: 'XElement',
            file: './web/x-element.js',
            format: 'esm',
            indent: '\t',
        },
        plugins: [ typescript({ tsconfig: './tsconfig.json' }) ]
    }
    // {
    //     input: 'src/router/router.ts',
    //     output: {
    //         name: 'XRouter',
    //         file: './web/x-router.js',
    //         format: 'esm',
    //         indent: '\t',
    //     },
    //     plugins: [ typescript({ tsconfig: './tsconfig.json' }) ]
    // }
]);

watcher.on('event', ({ result }) => {
    if (result) result.close();
});

watcher.close();
