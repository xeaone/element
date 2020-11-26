import { Watch, Spawn, Execute, Press } from './packer.js';

// const pkg = readFileSync('./package.json');
// const { name, version, license, author, email } = JSON.parse(pkg);
// const header = `
// /*
//     Name: ${name}
//     Version: ${version}
//     License: ${license}
//     Author: ${author}
//     Email: ${email}
//     This Source Code Form is subject to the terms of the Mozilla Public
//     License, v. 2.0. If a copy of the MPL was not distributed with this
//     file, You can obtain one at http://mozilla.org/MPL/2.0/.
// */
// `;

console.log(`
    b: builds
    e: exits
`);

const child = await Spawn('muleify -ss web');

const build = async function () {
    console.log('build: start');
    await Execute('tsc -b tsconfig.json');
    await Execute('rollup -c rollup.js');
    console.log('build: end');
};

const exit = async function () {
    console.log('exit: start');
    child.kill();
    console.log('exit: end');
    process.exit();
};

await Watch('./src', () => build());
await Press('b', () => build());
await Press('e', () => exit());
await build();
