import { BinderType } from './types.ts';


const checkedHandler = async function (binder: BinderType, event?: Event) {
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
};

const checkedSetup = function (binder: BinderType) {
    if (binder.owner.type === 'radio') {
        binder.owner.addEventListener('input', async function checkInput(event: Event) {
            const parent = binder.owner.form || binder.owner.getRootNode();
            const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);

            await checkedHandler(binder, event);

            for (const radio of radios) {
                if (radio === event.target) continue;
                if (radio?.x?.checked) {
                    checkedHandler(radio.x.checked, new Event('input'));
                } else {
                    radio.checked = false;
                    radio.removeAttribute('checked');
                }
            }
        });
    } else {
        binder.owner.addEventListener('input', function checkInput(event: Event) {
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
