/**
* @version 10.0.4
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { Initialize, Variables } from './types';
import { update } from './update';
import { define } from './define';
import { style } from './style';
export { define, style, update };
/**
 * @description
 * @param strings
 * @param variables
 * @returns {DocumentFragment}
 */
export declare const html: (strings: TemplateStringsArray, ...variables: Variables) => Initialize;
