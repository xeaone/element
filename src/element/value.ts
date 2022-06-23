import Binder from './binder.ts';
import format from './format.ts';
import date from './date.ts';

const defaultInputEvent = new Event('input');

const parseable = function (value: any) {
    return !isNaN(value) && value !== undefined && typeof value !== 'string';
};

// const stampFromView = function (data: number) {
//     const date = new Date(data);
//     return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
//         date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()).getTime();
// };

// const stampToView = function (data: number) {
//     const date = new Date(data);
//     return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(),
//         date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())).getTime();
// };

const input = function (binder: any, event: Event) {
    const { owner } = binder;
    const { type } = owner;

    if (type === 'select-one') {
        const [ option ] = owner.selectedOptions;
        const value = option ? '$value' in option ? option.$value : option.value : undefined;
        owner.$value = binder.compute({ event, $event: event, $value: value, $assignment: true });
    } else if (type === 'select-multiple') {
        const value = Array.prototype.map.call(owner.selectedOptions, o => '$value' in o ? o.$value : o.value);
        owner.$value = binder.compute({ event, $event: event, $value: value, $assignment: true });
    } else if (type === 'number' || type === 'range' || date.includes(type)) {
        const value = '$value' in owner && typeof owner.$value === 'number' ? owner.valueAsNumber : owner.value;
        owner.$value = binder.compute({ event, $event: event, $value: value, $assignment: true });
    } else {
        const value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
        const checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
        owner.$value = binder.compute({ event, $event: event, $value: value, $checked: checked, $assignment: true });
    }

};

export default class Value extends Binder {

    render () {
        const { meta } = this;
        const { type } = this.owner as HTMLInputElement | HTMLSelectElement;

        if (!meta.setup) {
            meta.setup = true;
            this.owner.addEventListener('input', (event: Event) => input(this, event));
        }

        const computed = this.compute({ event: undefined, $event: undefined, $value: undefined, $checked: undefined, $assignment: false });

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
            else owner.valueAsNumber = computed;
            display = owner.value;
        } else {
            const owner = this.owner as HTMLInputElement;
            display = format(computed);
            owner.value = display;
        }

        (this.owner as any).$value = computed;
        this.owner.setAttribute('value', display);

    }

    reset () {
        const { type } = this.owner as HTMLInputElement | HTMLSelectElement;

        if (type === 'select-one' || type === 'select-multiple') {
            const owner = this.owner as HTMLSelectElement;
            Array.prototype.forEach.call(owner.options, option => option.selected = false);
        }

        (this.owner as any).value = '';
        (this.owner as any).$value = undefined;
        this.owner.setAttribute('value', '');
    }

}

