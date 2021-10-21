
const flag = Symbol('RadioFlag');

const handler = async function (binder, event?: Event) {
    const checked = binder.owner.checked;
    const computed = await binder.compute({ $event: event, $checked: checked, $assignment: true });

    if (computed) {
        binder.owner.setAttributeNode(binder.node);
    } else {
        binder.owner.removeAttribute('checked');
    }

};

const checkedRender = async function (binder) {

    if (!binder.meta.setup) {
        binder.node.value = '';
        binder.meta.setup = true;

        if (binder.owner.type === 'radio') {
            binder.owner.addEventListener('input', async event => {
                if (event.detail === flag) return handler(binder, event);

                const parent = binder.owner.form || binder.owner.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
                const input = new CustomEvent('input', { detail: flag });

                for (const radio of radios) {
                    if (radio === event.target) {
                        await handler(binder, event);
                    } else {

                        let checked;
                        const bounds = binder.binder.ownerBinders.get(binder.owner);
                        if (bounds) {
                            for (const bound of bounds) {
                                if (bound.name === 'checked') {
                                    checked = bound;
                                    break;
                                }
                            }
                        }

                        if (checked) {
                            radio.dispatchEvent(input);
                        } else {
                            radio.checked = !event.target.checked;
                            if (radio.checked) {
                                radio.setAttribute('checked', '');
                            } else {
                                radio.removeAttribute('checked');
                            }
                        }

                    }
                }

            });
        } else {
            binder.owner.addEventListener('input', event => handler(binder, event));
        }

    }

    await handler(binder);
};

const checkedUnrender = async function (binder) {
    binder.owner.removeAttribute('checked');
};

export default { render: checkedRender, unrender: checkedUnrender };