
const flag = Symbol('RadioFlag');

const handler = function (binder, event?: Event) {
    const checked = binder.owner.checked;
    const computed = binder.compute({ $event: event, $checked: checked, $assignment: !!event });

    if (computed) {
        binder.owner.setAttributeNode(binder.node);
    } else {
        binder.owner.removeAttribute('checked');
    }

};

const checkedRender = function (binder) {

    if (!binder.meta.setup) {
        binder.node.value = '';
        binder.meta.setup = true;

        if (binder.owner.type === 'radio') {
            binder.owner.addEventListener('input', event => {
                if (event.detail === flag) return handler(binder, event);

                const parent = binder.owner.form || binder.owner.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
                const input = new CustomEvent('input', { detail: flag });

                for (const radio of radios) {
                    if (radio === event.target) {
                        handler(binder, event);
                    } else {

                        let checked;
                        const bounds = binder.container.binders.get(binder.owner);
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

    handler(binder);
};

const checkedUnrender = function (binder) {
    binder.owner.removeAttribute('checked');
};

export default { render: checkedRender, unrender: checkedUnrender };