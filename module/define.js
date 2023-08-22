/**
 * @version 9.1.2
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
export default function define(name, constructor) {
    if (customElements.get(name) !== constructor) {
        customElements.define(name, constructor);
    }
}
//# sourceMappingURL=define.js.map