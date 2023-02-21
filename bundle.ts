
const pkgFile = await Deno.readTextFile('./package.json');
const pkg = JSON.parse(pkgFile);

const { license, author, email, version } = pkg;

// Version: ${version}
const banner = `/************************************************************************
Name: XElement
Version: 8.0.0
License: ${license}
Author: ${author}
Email: ${email}
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
************************************************************************/
`;

await Deno.run({ cmd: ['deno', 'bundle', 'src/index.ts', 'web/x-element.js'] }).status();
const web = await Deno.readTextFile('web/x-element.js');
await Deno.writeTextFile('web/x-element.js', banner + web);

await Deno.run({ cmd: ['deno', 'bundle', 'src/index.ts', 'pro/x-element.js'] }).status();
const pro = await Deno.readTextFile('pro/x-element.js');
await Deno.writeTextFile('pro/x-element.js', banner + pro);