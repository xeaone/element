const flag = Symbol('RadioFlag');

const handler = async function (binder, event) {
    const checked = binder.node.checked;
    const computed = await binder.compute({ $event: event, $checked: checked, $assignment: !!event });

    if (computed) {
        binder.node.setAttribute('checked', '');
    } else {
        binder.node.removeAttribute('checked');
    }

};

const checkedRender = async function (binder) {

    if (!binder.setup) {
        binder.node.value = '';
        binder.setup = true;

        if (binder.node.type === 'radio') {
            binder.node.addEventListener('input', async function (event) {
                if (event.detail === flag) return handler(binder, event);

                const parent = binder.node.form || binder.node.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${binder.node.name}"]`);
                const input = new CustomEvent('input', { detail: flag });

                for (const radio of radios) {
                    if (radio === event.target) {
                        await handler(binder, event);
                    } else {

                        let checked;
                        // const bounds = binder.binder.ownerBinders.get(binder.node);
                        // if (bounds) {
                        //     for (const bound of bounds) {
                        //         if (bound.name === 'checked') {
                        //             checked = bound;
                        //             break;
                        //         }
                        //     }
                        // }

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
            binder.node.addEventListener('input', function (event) {
                handler(binder, event);
            });
        }

    }

    await handler(binder);
};

const checkedDerender = function (binder) {
    binder.node.removeAttribute('checked');
};

export default { render: checkedRender, derender: checkedDerender };