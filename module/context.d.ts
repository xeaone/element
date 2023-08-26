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
type ContextMethod = () => void;
type ContextData = Record<string, any>;
declare const Context: (data: ContextData, method: ContextMethod) => Record<any, any>;
export default Context;
