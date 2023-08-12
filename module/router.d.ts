/**
 * @version 9.1.1
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
import { Handler } from './types';
declare const router: (path: string, root: Element, handler: Handler) => void;
export default router;
