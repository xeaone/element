
const xRadioInputHandlerEvent = new CustomEvent('xRadioInputHandler');

const handler = function (event?: Event, binder?: any) {
    const owner = binder.owner as HTMLInputElement;
    const checked = owner.checked;
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = !!event;
    binder.instance.$checked = checked;
    const computed = binder.compute();

    if (computed) {
        owner.setAttributeNode(binder.node as Attr);
    } else {
        owner.removeAttribute('checked');
    }
};

export default {

    render (binder: any) {

        if (!binder.meta.setup) {
            binder.meta.setup = true;
            binder.node.nodeValue = '';

            if ((binder.owner as any).type === 'radio') {
                binder.owner?.addEventListener('xRadioInputHandler', (event: any) => handler(event, binder));

                binder.owner?.addEventListener('input', (event: any) => {
                    const parent = (binder.owner as any).form || binder.owner?.getRootNode();
                    const radios = parent.querySelectorAll(`[type="radio"][name="${(binder.owner as any).name}"]`);

                    handler(event, binder);

                    for (const radio of radios) {
                        if (radio === event.target) continue;
                        radio.checked = false;
                        radio.dispatchEvent(xRadioInputHandlerEvent);
                    }

                });
            } else {
                binder.owner?.addEventListener('input', (event: any) => handler(event, binder));
            }

        }

        handler(undefined, binder);
    },

    reset (binder: any) {
        binder.owner?.removeAttribute('checked');
    }

};