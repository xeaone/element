/**
 * @version 9.1.6
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
import { replaceChildren } from './poly';
import component from './component';
import define from './define';
import dash from './dash';
const alls = [];
const routes = [];
const transition = async function (route) {
    if (route.instance) {
        replaceChildren(route.root, route.instance);
    }
    else {
        const result = await route.handler();
        if (result?.prototype instanceof HTMLElement) {
            route.construct = result;
        }
        else if (result?.default?.prototype instanceof HTMLElement) {
            route.construct = result.default;
        }
        else {
            throw new Error('XElement - router handler requires a CustomElementConstructor');
        }
        if (route.construct.prototype instanceof component) {
            route.instance = await route.construct.upgrade();
        }
        else {
            route.tag = dash(route.construct.name);
            define(route.tag, route.construct);
            route.instance = document.createElement(route.tag);
        }
        replaceChildren(route.root, route.instance);
    }
};
const navigate = function (event) {
    if (event && 'canIntercept' in event && event.canIntercept === false)
        return;
    if (event && 'canTransition' in event && event.canTransition === false)
        return;
    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);
    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';
    const pathname = destination.href.replace(base.href, '/');
    const transitions = [];
    for (const route of routes) {
        if (route.path !== pathname)
            continue;
        transitions.push(route);
    }
    for (const all of alls) {
        let has = false;
        for (const transition of transitions) {
            if (transition.root === all.root) {
                has = true;
                break;
            }
        }
        if (has)
            continue;
        transitions.push(all);
    }
    if (event?.intercept) {
        return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
    }
    else if (event?.transitionWhile) {
        return event.transitionWhile(transitions.map((route) => transition(route)));
    }
    else {
        transitions.map((route) => transition(route));
    }
};
const router = function (path, root, handler) {
    if (!path)
        throw new Error('XElement - router path required');
    if (!handler)
        throw new Error('XElement - router handler required');
    if (!root)
        throw new Error('XElement - router root required');
    if (path === '/*') {
        for (const all of alls) {
            if (all.path === path && all.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        alls.push({ path, root, handler, });
    }
    else {
        for (const route of routes) {
            if (route.path === path && route.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        routes.push({ path, root, handler, instance: undefined });
    }
    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
};
export default router;
//# sourceMappingURL=router.js.map