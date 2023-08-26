/**
 * @version 9.1.8
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
import { Expressions, HTML } from './types';
export declare const symbol: unique symbol;
export default function html(strings: TemplateStringsArray, ...expressions: Expressions): HTML;
