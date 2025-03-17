/**
* @version 10.0.5
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { Binder } from './types';
// import { update } from './update';

export const event = function (binder: Binder) {
    return {
        get target() {
            return binder?.node;
        },
        // update,
        query(selector: string): Element | null {
            return (binder?.node?.getRootNode() as Element)?.querySelector(selector);
        },
    };
};
