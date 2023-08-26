/**
 * @version 9.1.7
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
import mark from './mark';
import { createHTML } from './poly';
import { Expressions, HTML } from './types';
// import parse from './parse';

export const symbol = Symbol('html');
const cache: WeakMap<TemplateStringsArray, [ HTMLTemplateElement, string ]> = new WeakMap();

export default function html (strings: TemplateStringsArray, ...expressions: Expressions): HTML {
    const value = cache.get(strings);
    if (value) {
        const [ template, marker ] = value;

        return { strings, template, expressions, symbol, marker };
    } else {
        const marker = `x-${mark()}-x`;
        // const marker = `X-${mark()}-X`;

        let data = '';

        const length = strings.length - 1;

        for (let index = 0; index < length; index++) {
            data += `${strings[ index ]}${marker}`;
        }

        data += strings[ length ];

        const template = document.createElement('template');
        template.innerHTML = createHTML(data);

        cache.set(strings, [ template, marker ]);

        return { strings, template, expressions, symbol, marker };
    }
}
