import { BinderType } from './types.ts';

const checkedEvent = new CustomEvent('xRadioInputHandler');

const checkedHandler = async function (event?: Event, binder?: any) {
    const owner = binder.owner as HTMLInputElement;
    const checked = event === undefined ? undefined : owner.checked;

    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = !!event;
    binder.instance.$checked = checked;

    const computed = await binder.compute();

    if (computed) {
        owner.setAttributeNode(binder.node);
    } else {
        owner.removeAttribute('checked');
    }
};

const checkedSetup = function (binder: BinderType) {
    if (binder.owner.type === 'radio') {
        binder.owner.addEventListener('xRadioInputHandler', (event: any) => checkedHandler(event, binder));
        binder.owner.addEventListener('input', async (event: InputEvent) => {
            const parent = binder.owner.form || binder.owner.getRootNode();
            const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);

            await checkedHandler(event, binder);

            for (const radio of radios) {
                if (radio === event.target) continue;
                radio.checked = false;
                radio.dispatchEvent(checkedEvent);
            }
        });
    } else {
        binder.owner.addEventListener('input', (event: InputEvent) => checkedHandler(event, binder));
    }
};

const checkedRender = async function (binder: BinderType) {
    await checkedHandler(undefined, binder);
};

const checkedReset = function (binder: BinderType) {
    binder.owner?.removeAttribute('checked');
};

const checkedDefault = { setup: checkedSetup, render: checkedRender, reset: checkedReset };

export default checkedDefault;
