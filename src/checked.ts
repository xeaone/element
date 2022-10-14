import { BinderType } from './types.ts';

const checkedEvent = new Event('input');

const checkedHandler = async function (binder: BinderType, event?: Event) {
    if (binder.meta.busy) return;

    binder.meta.busy = true;
    binder.instance.event = event;
    binder.instance.$checked = event ? binder.owner.checked : undefined;

    const computed = await binder.compute();

    if (computed) {
        binder.owner.checked = true;
        binder.owner.setAttribute('checked', '');
    } else {
        binder.owner.checked = false;
        binder.owner.removeAttribute('checked');
    }

    binder.meta.busy = false;
};

const checkedSetup = function (binder: BinderType) {
    if (binder.owner.type === 'radio') {
        binder.owner.addEventListener('input', async function checkedInput(event: Event) {
            await checkedHandler(binder, event);

            const parent = binder.owner.form || binder.owner.getRootNode();
            const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
            for (const radio of radios) {
                if (radio === event.target) continue;
                radio.checked = false;
                radio.removeAttribute('checked');
                if (radio?.x?.checked) {
                    checkedHandler(radio.x.checked, checkedEvent);
                }
            }
        });
    } else {
        binder.owner.addEventListener('input', function checkedInput(event: Event) {
            checkedHandler(binder, event);
        });
    }
};

const checkedRender = async function (binder: BinderType) {
    await checkedHandler(binder);
};

const checkedReset = function (binder: BinderType) {
    binder.owner.checked = undefined;
    binder.owner.removeAttribute('checked');
};

const checkedDefault = {
    setup: checkedSetup,
    render: checkedRender,
    reset: checkedReset,
};

export default checkedDefault;
