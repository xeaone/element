
const handler = async function (binder, checked, event?: Event) {
    const { owner, node } = binder;
    const { value } = owner;
    const computed = await binder.compute({ event, checked, value });

    owner.checked = computed;

    if (owner.checked) {
        owner.setAttributeNode(node);
    } else {
        owner.removeAttribute('checked');
    }

};

const checked = async function (binder) {
    const { owner, meta } = binder;

    if (!meta.setup) {
        meta.setup = true;
        owner.removeAttribute('checked');
        owner.addEventListener('input', async (event) => {
            const checked = owner.checked;
            await handler(binder, checked, event);
        });

        if (owner.type === 'radio') {
            const parent = owner.form || owner.getRootNode();
            const radios = parent.querySelectorAll(`[type="radio"][name="${owner.name}"]`);
            owner.addEventListener('input', async () => {
                for (const radio of radios) {
                    const radioBinders = binder.binder.get(radio.getAttributeNode('checked'));
                    if (radioBinders) {
                        for (const radioBinder of radioBinders) {
                            // radioBinder.busy = true;
                            await radioBinder.compute({ checked: radio.checked, value: radio.value });
                            // radioBinder.busy = false;
                        }
                    } else {
                        if (radio.checked) {
                            radio.setAttribute('checked', '');
                        } else {
                            radio.removeAttribute('checked');
                        }
                    }
                }
            });
        }
    }

    const checked = binder.assignee();
    await handler(binder, checked);
};

export default checked;