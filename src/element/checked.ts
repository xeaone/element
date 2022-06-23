import Binder from './binder.ts';

const flag = Symbol('RadioFlag');

const handler = function (binder: any, event?: Event) {
    const checked = binder.owner.checked;
    const computed = binder.compute({ $event: event, $checked: checked, $assignment: !!event });

    if (computed) {
        binder.owner.setAttributeNode(binder.node);
    } else {
        binder.owner.removeAttribute('checked');
    }

};

export default class Checked extends Binder {

    render () {

        if (!this.meta.setup) {
            // this.node.value = '';
            this.meta.setup = true;

            if ((this.owner as any).type === 'radio') {
                this.owner.addEventListener('input', (event) => {
                    if ((event as any).detail === flag) return handler(this, event);

                    const parent = (this.owner as any).form || this.owner.getRootNode();
                    const radios = parent.querySelectorAll(`[type="radio"][name="${(this.owner as any).name}"]`);

                    for (const radio of radios) {
                        if (radio === event.target) {
                            handler(this, event);
                        } else {

                            let checked;
                            // const bounds = this.get(this.owner);
                            // if (bounds) {
                            //     for (const bound of bounds) {
                            //         if (bound.name === 'checked') {
                            //             checked = bound;
                            //             break;
                            //         }
                            //     }
                            // }

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
                this.owner.addEventListener('input', (event) => handler(this, event));
            }

        }

        handler(this);
    }

    reset () {
        this.owner.removeAttribute('checked');
    }

}