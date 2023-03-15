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
    state?: (instance:any) => any;
    template: (instance:any) => any;
}

const mount = async function (options: Options) {
    console.log(options);

    // const source = roots.get(root);
    // call disconnect

    // if (root.mounted) return;
    // else root.mounted = true;

    const instance:any = {
        html,
        busy: true,
        actions: [],
        expressions: [],
        template: options.template,
        root: options.root,
        state: undefined,
        get s () { return this.state; },
        get r () { return this.root; },
        get h () { return this.html; },
        get t () { return this.template },
    };

    if (options.state) {
        instance.state = observe(options.state(instance), () => upgrade(instance));
    }

    roots.set(instance.root, instance);

    instance.root.dispatchEvent(connectingEvent);
    await instance.state?.connecting?.();

    instance.root.dispatchEvent(upgradingEvent);
    await instance.state?.upgrading?.()?.catch(console.error);

    const result = instance.template(instance);

    // root.expressions.splice(0, -1, ...result.values);
    // root.fragment = result.template.content.cloneNode(true);
    const fragment = result.template.content.cloneNode(true);

    render(fragment, result.expressions, instance.actions);
    // render(root.fragment, result.expressions, root.actions);
    // render(root.fragment, root.expressions, root.actions);

    document.adoptNode(fragment);
    // document.adoptNode(root.fragment);

    const length = instance.actions.length;
    for (let index = 0; index < length; index++) {
        const newExpression = result.expressions[index];
        instance.actions[index](undefined, newExpression);
        instance.expressions[index] = newExpression;
    }

    // const task = schedule(root.actions, Array(root.actions.length).fill(undefined), root.expressions);
    // await task;

    replaceChildren(instance.root?.shadowRoot ?? instance.root, fragment);

    instance.busy = false;

    await instance.state?.upgraded?.()?.catch(console.error);
    instance.root.dispatchEvent(upgradedEvent);

    await instance.state?.connected?.();
    instance.root.dispatchEvent(connectedEvent);
};

export default mount;