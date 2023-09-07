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
import { Route, Handler, Module } from './types';
import { replaceChildren } from './poly';
import component, { task } from './component';
import define from './define';
import dash from './dash';
import upgrade from './upgrade';

const alls: Array<Route> = [];
const routes: Array<Route> = [];

// const position = function (parent: Element) {
//     return {
//         parent: parent?.scrollTop,
//         body: document?.body?.scrollTop,
//         documentElement: document?.documentElement?.scrollTop,
//     };
// };

const tick = function (element: Element) {
    return new Promise(async resolve => {
        if (element && element instanceof component) {
            await element[ task ];
            requestAnimationFrame(() => resolve(undefined));
        } else {
            requestAnimationFrame(() => resolve(undefined));
        }
    });
};

// window.addEventListener('popstate', (event) => {
//     console.log(event);
// });

const transition = async function (route: Route) {
    if (route.instance) {
        const ready = tick(route.instance);
        replaceChildren(route.root, route.instance);
        await ready;
    } else {
        const result = await route.handler();

        if ((result as CustomElementConstructor)?.prototype instanceof HTMLElement) {
            route.construct = result as CustomElementConstructor;
        } else if (((result as Module)?.default as CustomElementConstructor)?.prototype instanceof HTMLElement) {
            route.construct = (result as Module).default as CustomElementConstructor;
        } else {
            throw new Error('XElement - router handler requires Module or CustomElementConstructor');
        }

        if (route.construct.prototype instanceof component) {
            route.instance = await (route.construct as typeof component).create();
        } else {
            route.tag = dash(route.construct.name);
            define(route.tag, route.construct);
            route.instance = document.createElement(route.tag);
            upgrade(route.instance);
        }

        const ready = tick(route.instance);
        replaceChildren(route.root, route.instance);
        await ready;
    }
};

const navigate = function (event?: any) {
    if (event && 'canIntercept' in event && event.canIntercept === false) return;
    if (event && 'canTransition' in event && event.canTransition === false) return;

    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);

    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';

    const pathname = destination.href.replace(base.href, '/');
    const transitions: Array<Route> = [];

    // window.history.replaceState(destination.href, JSON.stringify(position(route.root)));

    for (const route of routes) {
        if (route.path !== pathname) continue;
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

        if (has) continue;

        transitions.push(all);
    }

    if (event?.intercept) {
        return event.intercept({
            handler: async () => {
                await Promise.all(transitions.map((route) => transition(route)));
            }
        });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(Promise.all(transitions.map((route) => transition(route))));
    } else {
        Promise.all(transitions.map((route) => transition(route)));
    }
};

const router = function (path: string, root: Element, handler: Handler) {
    if (!path) throw new Error('XElement - router path required');
    if (!handler) throw new Error('XElement - router handler required');
    if (!root) throw new Error('XElement - router root required');

    if (path === '/*') {
        for (const all of alls) {
            if (all.path === path && all.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }

        alls.push({ path, root, handler, });
    } else {
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
