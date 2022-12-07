import Component from './component.ts';
import Render from './render.ts';
import Dash from './dash.ts';
import { $ } from './tool.ts';

type Route = {
    path?: string;
    cache?: boolean;

    context?: any;
    instance?: any;
    component?: any;
    construct?: any;

    name?: string;
    target: Element;
};

const alls: Array<Route> = [];
const routes: Array<Route> = [];

const transition = async function (route: Route) {
    if (route.cache && route.instance) {
        if (route.instance instanceof Component || route.instance.prototype instanceof Component) {
            route.target.replaceChildren(route.instance);
            await route.instance[$].render();
        } else {
            await route.instance.render();
        }
    } else {
        if (route.component instanceof Component || route.component.prototype instanceof Component) {
            route.name = route.name ?? Dash(route.component.name);

            if (!/^\w+-\w+/.test(route.name)) route.name = `x-${route.name}`;

            if (!customElements.get(route.name)) customElements.define(route.name, route.component);
            await customElements.whenDefined(route.name);

            route.instance = document.createElement(route.name);
            route.target.replaceChildren(route.instance);
            route.instance[$].render();
        } else {
            route.instance = await Render(route.target, route.component, route.context);
        }
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

    for (const route of routes) {
        if (route.path !== pathname) continue;
        if (!route.target) continue;

        // const current = Reflect.get(route.target, 'xRouterCurrent');
        // if (current === route) continue;

        // const busy = Reflect.get(route.target, 'xRouterBusy');
        // if (busy) continue;

        // if (Reflect.get(route.target, 'xRouterPath') === route.path) continue;

        // const current = Reflect.get(route.target, 'xRouterCurrent');
        // if (current) current.instance.childNodes = Array.from(current.target.childNodes);

        // Reflect.set(route.target, 'xRouterBusy', true);
        Reflect.set(route.target, 'xRouterPath', route.path);
        transitions.push(route);
    }

    for (const all of alls) {
        if (!all.target) continue;
        let has = false;

        for (const transition of transitions) {
            if (transition.target === all.target) {
                has = true;
                break;
            }
        }

        if (has) continue;
        if (Reflect.get(all.target, 'xRouterPath') === pathname) continue;
        // if (all.target && Reflect.get(all.target, 'xRouterBusy')) continue;
        // if (all.target) Reflect.set(all.target, 'xRouterBusy', true);

        transitions.push(all);
    }

    // if (!transitions.length) return;

    if (event?.intercept) {
        return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(transitions.map((route) => transition(route)));
    } else {
        transitions.map((route) => transition(route));
    }
};

export default function Router(path: string, target: Element, component: any, context?: any, cache?: boolean) {
    if (!path) throw new Error('XElement - router path required');
    if (!target) throw new Error('XElement - router target required');
    if (!component) throw new Error('XElement - router component required');
    if (!(component instanceof Component || component.prototype instanceof Component) && !context) throw new Error('XElement - router context required');

    if (path === '/*') {
        for (const all of alls) {
            if (all.path === path && all.target === target) {
                throw new Error('XElement - router duplicate path and target');
            }
        }

        alls.push({ path, target, context, component, cache: cache ?? true });
    } else {
        for (const route of routes) {
            if (route.path === path && route.target === target) {
                throw new Error('XElement - router duplicate path and target');
            }
        }

        routes.push({ path, target, context, component, cache: cache ?? true });
    }

    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
}
