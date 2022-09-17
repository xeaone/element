import { BinderType } from './types.ts';

const inheritSetup = function (binder: BinderType) {
    // binder.meta.rerendered = false;
};

const inheritRender = async function (binder: BinderType) {
    if (typeof binder.owner.inherited !== 'function') {
        return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
    }

    const inherited = await binder.compute();
    await binder.owner.inherited(inherited);

    // if (!binder.meta.rerendered) {
    // binder.meta.rerendered = true;
    await binder.container.register(binder.owner, binder.context, binder.rewrites);
    // }
};

const inheritReset = async function (binder: BinderType) {
    if (typeof binder.owner.inherited !== 'function') {
        return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
    }

    await binder.owner.inherited?.();
    // todo: maybe reset
};

const inheritDefault = { setup: inheritSetup, render: inheritRender, reset: inheritReset };

export default inheritDefault;
