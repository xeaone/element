/**
* @version 10.0.1
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
// import { update } from './update';
export const event = function (binder) {
    return {
        get target() {
            return binder?.node;
        },
        // update,
        query(selector) {
            return binder?.node?.getRootNode()?.querySelector(selector);
        },
    };
};
