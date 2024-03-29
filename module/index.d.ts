/**
 * @version 9.1.10
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
import Component from './component';
import Router from './router';
import html from './html';
export { Component };
export { Component as component };
export { Router };
export { Router as router };
export { html };
declare const _default: {
    Component: typeof Component;
    component: typeof Component;
    Router: (path: string, root: Element, handler: import("./types").Handler) => void;
    router: (path: string, root: Element, handler: import("./types").Handler) => void;
    html: typeof html;
};
export default _default;
