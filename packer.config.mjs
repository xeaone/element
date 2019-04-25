import Package from './package.json';

export default {
    name: 'oxe',
    input: 'src/index.js',
    output: [
        { output: 'dev/oxe.js' },
        { output: 'dev/oxe.min.js', minify: true }
    ],
    header: `/*
    	Name: ${Package.name}
    	Version: ${Package.version}
    	License: ${Package.license}
    	Author: ${Package.author}
    	Email: ${Package.email}
    	This Source Code Form is subject to the terms of the Mozilla Public
    	License, v. 2.0. If a copy of the MPL was not distributed with this
    	file, You can obtain one at http://mozilla.org/MPL/2.0/.
    */
    `
};
