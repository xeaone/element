import Component from './component.ts';
import Render from './render.ts';
import Dash from './dash.ts';

type Route = {
    path?: string;
    cache?: boolean;

    context?: any;
    instance?: any;
    component?: any;
    construct?: any;

    name?: string;
    busy?: boolean;
    target?: Element;
};

const alls: Array<Route> = [];
const routes: Array<Route> = [];

const transition = async function (route: Route) {
    if (!route.target) throw new Error('XElement - transition target option required');

    if (route.busy) return;
    else route.busy = true;

    if (route.cache && route.instance) {
        route.busy = false;

        if (route.instance instanceof Component) {
            if (route.target.firstChild !== route.instance) {
                route.target.replaceChildren(route.instance);
            }
        } else {
            let index;
            const parent = route.target;
            const targetNodes = route.instance;
            const sourceNodes = route.target.childNodes;
            const sourceLength = sourceNodes.length;
            const targetLength = targetNodes.length;
            const commonLength = Math.min(sourceLength, targetLength);

            for (index = 0; index < commonLength; index++) {
                const sourceNode = sourceNodes[index];
                const targetNode = targetNodes[index];
                if (sourceNode !== targetNode) {
                    parent.replaceChild(targetNode, sourceNode);
                }
            }

            if (sourceLength > targetLength) {
                for (index = targetLength; index < sourceLength; index++) {
                    parent.removeChild(parent.lastChild as Node);
                }
            } else if (sourceLength < targetLength) {
                for (index = sourceLength; index < targetLength; index++) {
                    const child = targetNodes[index];
                    parent.appendChild(child);
                }
            }
        }

        return;
    }

    if (route.component instanceof Component) {
        route.name = route.name ?? Dash(route.construct.name);

        if (!/^\w+-\w+/.test(route.name)) route.name = `x-${route.name}`;

        if (!customElements.get(route.name)) customElements.define(route.name, route.construct);
        await customElements.whenDefined(route.name);

        route.instance = document.createElement(route.name);
        route.target.replaceChildren(route.instance);
    } else {
        route.target.replaceChildren();
        Render(() => route.target as any, route.context, route.component);
        route.instance = Array.from(route.target.childNodes);
    }

    route.busy = false;
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

    console.log(pathname);

    for (const route of routes) {
        if (route.path === pathname) {
            transitions.push(route);
        }
    }

    for (const all of alls) {
        let has = false;

        for (const transition of transitions) {
            if (transition.target === all.target) {
                has = true;
                break;
            }
        }

        if (has) continue;

        transitions.push(all);
    }

    // console.log(transitions)

    if (!transitions.length) return;

    if (event?.intercept) {
        return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(transitions.map((route) => transition(route)));
    } else {
        transitions.map((route) => transition(route));
    }
};

export default function router(path: string, target: Element, component: any, context?: any, cache?: boolean) {
    if (!path) throw new Error('XElement - router path required');
    if (!target) throw new Error('XElement - router target required');
    if (!component) throw new Error('XElement - router component required');
    if (!(component instanceof Component) && !context) throw new Error('XElement - router context required');

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

    navigate();

    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
}
