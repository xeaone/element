import { connectingEvent, connectedEvent, upgradingEvent, upgradedEvent } from './events';
import { replaceChildren } from './poly';
import observe from './observe';
import upgrade from './upgrade';
import render from './render';
import roots from './roots';
import html from './html';

// type state = (instance:Instance) => any;
// type Content = (instance:Instance) => any;

// type Instance = {
//     html: typeof html;
//     busy: boolean;
//     actions: Array<any>;
//     expressions: Array<any>;
//     root: Element,
//     state?: Record<any,any>
//     content: Content;
// }

type Options = {
    root: Element;
    state?: (instance: any) => any;
    template: (instance: any) => any;
}
type Root = Element | ShadowRoot | DocumentFragment;
class Self extends Function {
    // expressions = [];
    // actions = [];
    html = html;
    // busy = true;
    self = this;
    root: Element | DocumentFragment | ShadowRoot;
    // component: any;
    // template: any;
    connecting?: (root: Root) => void | Promise<void>;
    upgrading?: (root: Root) => void | Promise<void>;
    upgraded?: (root: Root) => void | Promise<void>;
    connected?: (root: Root) => void | Promise<void>;
    // [key: string]: any;
    constructor(root: Element) {
        super();
        this.root = root;
        // this.self = this;
        // this.root = root;
        // this.component = component;
        return new Proxy(this, {
            apply(_t, _s, [strings, expressions]) {
                return html(strings, ...expressions);
            },
            get(t, k, r) {
                if (k === 'html' || k === 'h') return html;
                if (k === 'root' || k === 'r') return root;
                if (k === 'self' || k === 's') return t;
                return Reflect.get(t, k, r);
            },
            set(t, k, v, r) {
                if (k === 'html' || k === 'h') return false;
                if (k === 'root' || k === 'r') return false;
                if (k === 'self' || k === 's') return false;
                return Reflect.set(t, k, v, r);
            },
        });
    }
}

// let state = function () {
//     return new
// };

const mount = async function (root: Element, component: any) {
    // const mount = async function (options: Options) {

    // const source = roots.get(root);
    // call disconnect

    // if (root.mounted) return;
    // else root.mounted = true;

    const actions: any[] = [];
    const expressions: any[] = [];
    const self = new Self(root);
    const template = component(self, self);
    const data = {
        root,
        self,
        template,
        component,
        actions,
        expressions,
        busy: true,
    };

    roots.set(root, data);

    // if (options.state) {
    // instance.state = observe(options.state(instance), () => {
    // instance.state = observe({}, async () => {
    //     console.log('upgrade', instance.busy);
    //     if (instance.busy === false) {
    //         console.log(instance.state)
    //         return upgrade(instance);
    //     }
    // });
    // options.state(instance);
    // }

    const hyper = template();
    const fragment = hyper.template.content.cloneNode(true) as DocumentFragment;

    root.dispatchEvent(connectingEvent);
    await self?.connecting?.(fragment)?.catch(console.error);

    root.dispatchEvent(upgradingEvent);
    await self?.upgrading?.(fragment)?.catch(console.error);

    render(fragment, hyper.expressions, actions);

    document.adoptNode(fragment);

    const length = actions.length;
    for (let index = 0; index < length; index++) {
        const newExpression = hyper.expressions[index];
        actions[index](undefined, newExpression);
        expressions[index] = newExpression;
    }

    await self?.upgraded?.(fragment)?.catch(console.error);
    root.dispatchEvent(upgradedEvent);

    replaceChildren(root?.shadowRoot ?? root, fragment);

    await self?.connected?.(root)?.catch(console.error);
    root.dispatchEvent(connectedEvent);

    data.busy = false;
};

export default mount;