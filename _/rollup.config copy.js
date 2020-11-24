// import babel from '@rollup/plugin-babel';

// const bo = {
//     babelHelpers: 'bundled',
//     comments: false,
//     plugins: [ 
//         [ 'module:fast-async', { 'spec': true } ],
//         [ '@babel/plugin-proposal-class-properties' ]
//     ],
//     presets: [
//         [ '@babel/preset-env', {
//             modules: false,
//             targets: '> 0.5%, last 2 versions, Firefox ESR, not dead',
//             exclude: [ '@babel/plugin-transform-regenerator', '@babel/plugin-transform-async-to-generator' ]
//         } ]
//     ]
// };

export default {
    input: 'src/index.js',
    output: {
        name: 'Oxe',
        file: 'dev/o.ts',
        format: 'esm',
        indent: '    '
    },
    // plugins: [
        // babel(bo),
        // typescript(to)
    // ]
};