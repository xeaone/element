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

export default {

    render (binder: any) {
        binder = binder ?? this;

        const { meta } = binder;
        const { type } = binder.owner as HTMLInputElement | HTMLSelectElement;

        if (!meta.setup) {
            meta.setup = true;
            binder.owner?.addEventListener('input', (event: any) => input(binder, event));
        }

        binder.instance.$assign = false;
        binder.instance.$event = undefined;
        binder.instance.$value = undefined;
        binder.instance.$checked = undefined;
        const computed = binder.compute();

        let display;
        if (type === 'select-one') {
            const owner = binder.owner as HTMLSelectElement;
            owner.value = '';

            Array.prototype.find.call(owner.options, o => '$value' in o ? o.$value : o.value === computed);

            if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
                owner.options[ 0 ].selected = true;
                return owner.dispatchEvent(defaultInputEvent);
            }

            display = format(computed);
            owner.value = display;
        } else if (type === 'select-multiple') {
            const owner = binder.owner as HTMLSelectElement;
            Array.prototype.forEach.call(owner.options, o => o.selected = computed?.includes('$value' in o ? o.$value : o.value));
            display = format(computed);
        } else if (type === 'number' || type === 'range' || date.includes(type)) {
            const owner = binder.owner as HTMLInputElement;
            if (typeof computed === 'string') owner.value = computed;
            else if (typeof computed === 'number' && !isNaN(computed)) owner.valueAsNumber = computed;
            else owner.value = '';
            display = owner.value;
        } else {
            const owner = binder.owner as HTMLInputElement;
            display = format(computed);
            owner.value = display;
        }

        (binder.owner as any).$value = computed;
        binder.owner?.setAttribute('value', display);
    },

    reset (binder: any) {
        binder = binder ?? this;

        const { type } = binder.owner as HTMLInputElement | HTMLSelectElement;

        if (type === 'select-one' || type === 'select-multiple') {
            const owner = binder.owner as HTMLSelectElement;
            Array.prototype.forEach.call(owner.options, option => option.selected = false);
        }

        (binder.owner as any).value = '';
        (binder.owner as any).$value = undefined;
        binder.owner?.setAttribute('value', '');
    }

};

