import { BinderType, ElementType, HandlerType } from './types.ts';

import Context from './context.ts';
import Compute from './compute.ts';

import Standard from './standard.ts';
import Checked from './checked.ts';
import Inherit from './inherit.ts';
import Value from './value.ts';
import Html from './html.ts';
import Each from './each.ts';
import On from './on.ts';

export const BinderCreate = function (context: any, binders: any, attribute: any) {
    let { name, value, ownerElement } = attribute;

    if (name.startsWith('x-')) {
        name = name.slice(2);
    }

    if (value.startsWith('{{') && value.endsWith('}}')) {
        value = value.slice(2, -2);
    }

    let handler: HandlerType;
    if (name === 'html') handler = Html;
    else if (name === 'each') handler = Each;
    else if (name === 'value') handler = Value;
    else if (name === 'checked') handler = Checked;
    else if (name === 'inherit') handler = Inherit;
    else if (name.startsWith('on')) handler = On;
    else handler = Standard;

    const binder: any = {
        name,
        value,
        binders,
        meta: {},
        instance: {},
        owner: ownerElement,
        setup: undefined,
        reset: undefined,
        render: undefined,
        compute: undefined,
        context: undefined,
    };

    binder.reset = handler.reset.bind(null, binder);
    binder.render = handler.render.bind(null, binder);
    binder.setup = handler?.setup?.bind(null, binder);

    binder.owner.removeAttributeNode(attribute);
    binder.context = Context(context, binders, '', binder);
    binder.compute = Compute(value).bind(binder.owner, binder.context, binder.instance);

    binder.setup?.(binder);

    return binder;
};

export const BinderHandle = async function (context: any, binders: any, element: any) {
    const tasks = [];

    let each = false;

    for (const attribute of element.attributes) {
        const { name, value } = attribute;
        if (value.startsWith('{{') && value.endsWith('}}')) {
            each = name === 'each' || name === 'x-each';
            tasks.push(BinderCreate(context, binders, attribute).render());
        }
    }

    if (!each) {
        let child = element.firstElementChild;
        while (child) {
            tasks.push(BinderHandle(context, binders, child));
            child = child.nextElementSibling;
        }
    }

    await Promise.all(tasks);
};
