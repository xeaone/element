import Binder from './binder';
import format from './format';
import date from './date';

const defaultInputEvent = new Event('input');

const parseable = function (value: any) {
    return !isNaN(value) && value !== undefined && typeof value !== 'string';
};

const input = function (binder: any, event: Event) {
    const { owner } = binder;
    const { type } = owner;

    binder.instance.$event = event;
    binder.instance.$assign = true;

    if (type === 'select-one') {
        const [ option ] = owner.selectedOptions;
        binder.instance.$value = option ? '$value' in option ? option.$value : option.value : undefined;
        owner.$value = binder.compute();
    } else if (type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(owner.selectedOptions, o => '$value' in o ? o.$value : o.value);
        owner.$value = binder.compute();
    } else if (type === 'number' || type === 'range' || date.includes(type)) {
        binder.instance.$value = '$value' in owner && typeof owner.$value === 'number' ? owner.valueAsNumber : owner.value;
        owner.$value = binder.compute();
    } else {
        binder.instance.$value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
        binder.instance.$checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
        owner.$value = binder.compute();
    }

};

export default class Value extends Binder {

    render () {
        const { meta } = this;
        const { type } = this.owner as HTMLInputElement | HTMLSelectElement;

        if (!meta.setup) {
            meta.setup = true;
            this.owner?.addEventListener('input', event => input(this, event));
        }

        this.instance.$assign = false;
        this.instance.$event = undefined;
        this.instance.$value = undefined;
        this.instance.$checked = undefined;
        const computed = this.compute();

        let display;
        if (type === 'select-one') {
            const owner = this.owner as HTMLSelectElement;
            owner.value = '';

            Array.prototype.find.call(owner.options, o => '$value' in o ? o.$value : o.value === computed);

            if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
                owner.options[ 0 ].selected = true;
                return owner.dispatchEvent(defaultInputEvent);
            }

            display = format(computed);
            owner.value = display;
        } else if (type === 'select-multiple') {
            const owner = this.owner as HTMLSelectElement;
            Array.prototype.forEach.call(owner.options, o => o.selected = computed?.includes('$value' in o ? o.$value : o.value));
            display = format(computed);
        } else if (type === 'number' || type === 'range' || date.includes(type)) {
            const owner = this.owner as HTMLInputElement;
            if (typeof computed === 'string') owner.value = computed;
            else if (typeof computed === 'number' && !isNaN(computed)) owner.valueAsNumber = computed;
            else owner.value = '';
            display = owner.value;
        } else {
            const owner = this.owner as HTMLInputElement;
            display = format(computed);
            owner.value = display;
        }

        (this.owner as any).$value = computed;
        this.owner?.setAttribute('value', display);
    }

    reset () {
        const { type } = this.owner as HTMLInputElement | HTMLSelectElement;

        if (type === 'select-one' || type === 'select-multiple') {
            const owner = this.owner as HTMLSelectElement;
            Array.prototype.forEach.call(owner.options, option => option.selected = false);
        }

        (this.owner as any).value = '';
        (this.owner as any).$value = undefined;
        this.owner?.setAttribute('value', '');
    }

}

