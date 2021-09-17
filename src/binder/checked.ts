
const flag = Symbol('RadioFlag');

const handler = async function (binder, event?: Event) {
    const { owner, node } = binder;
    const checked = owner.checked;
    const computed = await binder.compute(event ? { event, checked } : null);

    if (computed) {
        owner.setAttributeNode(node);
    } else {
        owner.removeAttribute('checked');
    }

};

const checked = async function (binder) {
    const { owner } = binder;

    if (!binder.meta.setup) {
        binder.node.value = '';
        binder.meta.setup = true;

        if (owner.type === 'radio') {
            owner.addEventListener('input', async event => {
                if (event.detail === flag) return handler(binder, event);

                const parent = owner.form || owner.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${owner.name}"]`);
                const input = new CustomEvent('input', { detail: flag });

                for (const radio of radios) {
                    if (radio === event.target) {
                        await handler(binder, event);
                    } else {
                        const checked = radio?.$binders?.get('checked');
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
            owner.addEventListener('input', event => handler(binder, event));
        }

    }

    await handler(binder);
};

export default checked;