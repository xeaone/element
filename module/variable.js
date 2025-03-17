/**
* @version 10.0.3
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
export const Variable = function (index, variables) {
    return {
        get() {
            return variables[index];
        },
        set(value) {
            variables[index] = value;
            return value;
        },
    };
};
