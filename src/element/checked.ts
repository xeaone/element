
const flag = Symbol('RadioFlag');

const handler = function (binder: any, event?: InputEvent | CustomEvent) {
    const checked = binder.owner.checked;
    const computed = binder.compute({ $event: event, $checked: checked, $assignment: !!event });

    if (computed) {
        binder.owner.setAttributeNode(binder.node);
    } else {
        binder.owner.removeAttribute('checked');
    }

};

const checkedRender = function (binder: any) {

    if (!binder.meta.setup) {
        binder.node.value = '';
        binder.meta.setup = true;

        if (binder.owner.type === 'radio') {
            binder.owner.addEventListener('input', (event: InputEvent | CustomEvent) => {
                if (event.detail === flag) return handler(binder, event);

                const parent = binder.owner.form || binder.owner.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);

                for (const radio of radios) {
                    if (radio === event.target) {
                        handler(binder, event);
                    } else {

                        let checked;
                        const bounds = binder.binders.get(binder.owner);
                        if (bounds) {
                            for (const bound of bounds) {
                                if (bound.name === 'checked') {
                                    checked = bound;
                                    break;
                                }
                            }
                        }

                        if (checked) {
                            radio.dispatchEvent(new CustomEvent('input', { detail: flag }));
                        } else {
                            radio.checked = !(event.target as HTMLInputElement).checked;
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
            binder.owner.addEventListener('input', (event: InputEvent | CustomEvent) => handler(binder, event));
        }

    }

    handler(binder);
};

const checkedUnrender = function (binder: any) {
    binder.owner.removeAttribute('checked');
};

export default { render: checkedRender, unrender: checkedUnrender };