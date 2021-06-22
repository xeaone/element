// defaultChecked indeterminate

const handler = async function (binder, checked, event?: Event) {

    const { owner, node } = binder;
    const value = '$value' in owner ? owner.$value : owner.value;
    const computed = await binder.compute({ event, checked, value });

    const parent = owner.form || owner.getRootNode();
    const elements = owner.type === 'radio' ? parent.querySelectorAll(`[type="radio"][name="${owner.name}"]`) : [ owner ];

    owner.checked = computed;

    for (const element of elements) {
        if (element === owner) {
            if (owner.checked) {
                // node.value = '';
                owner.setAttributeNode(node);
            } else {
                element.removeAttribute('checked');
            }
        } else {
            element.removeAttribute('checked');
        }
    }

};

export default {
    async setup (binder) {
        const { owner } = binder;

        if (owner.type === 'radio') {
            const parent = owner.form || owner.getRootNode();
            const elements = parent.querySelectorAll(`[type="radio"][name="${owner.name}"]`);
            for (const element of elements) {
                if (!element._oCheckedListener && !/{{.*?}}/.test(element.getAttribute('checked'))) {
                    element._oCheckedListener = async () => {
                        const parent = owner.form || owner.getRootNode();
                        const radios = parent.querySelectorAll(`[type="radio"][name="${owner.name}"]`);
                        for (const radio of radios) {
                            const checkedBinder = binder.binders.get(radio.getAttributeNode('checked'));
                            if (checkedBinder) await handler(checkedBinder, radio.checked);
                        }
                    };
                    element.addEventListener('input', element._oCheckedListener);
                }
            }
        }

        owner.addEventListener('input', async (event) => {
            const checked = owner.checked;
            await handler(binder, checked, event);
        });
    },
    async write (binder) {
        const checked = binder.assignee();
        await handler(binder, checked);
    }
};
