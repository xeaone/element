/**
 * @version 9.1.5
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
export default function display(data) {
    switch (`${data}`) {
        case 'NaN': return '';
        case 'null': return '';
        case 'undefined': return '';
    }
    switch (typeof data) {
        case 'string': return data;
        case 'number': return `${data}`;
        case 'bigint': return `${data}`;
        case 'boolean': return `${data}`;
        case 'function': return `${data()}`;
        case 'symbol': return String(data);
        case 'object': return JSON.stringify(data);
    }
    throw new Error('XElement - display type not handled');
}
//# sourceMappingURL=display.js.map