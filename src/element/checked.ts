import Binder from './binder.ts';

export default class Checked extends Binder {

    static xRadioInputHandlerEvent = new CustomEvent('xRadioInputHandler');

    render () {

        if (!this.meta.setup) {
            this.meta.setup = true;
            this.node.nodeValue = '';

            if ((this.owner as any).type === 'radio') {
                this.owner?.addEventListener('xRadioInputHandler', (event) => this.#handler(event));

                this.owner?.addEventListener('input', (event) => {
                    const parent = (this.owner as any).form || this.owner?.getRootNode();
                    const radios = parent.querySelectorAll(`[type="radio"][name="${(this.owner as any).name}"]`);

                    this.#handler(event);

                    for (const radio of radios) {
                        if (radio === event.target) continue;
                        radio.checked = false;
                        radio.dispatchEvent(Checked.xRadioInputHandlerEvent);
                    }

                });
            } else {
                this.owner?.addEventListener('input', event => this.#handler(event));
            }

        }

        this.#handler();
    }

    reset () {
        this.owner?.removeAttribute('checked');
    }

    #handler (event?: Event) {
        const owner = this.owner as HTMLInputElement;
        const checked = owner.checked;
        this.instance.event = event;
        this.instance.$event = event;
        this.instance.$assign = !!event;
        this.instance.$checked = checked;
        const computed = this.compute();

        if (computed) {
            owner.setAttributeNode(this.node as Attr);
        } else {
            owner.removeAttribute('checked');
        }
    }

}