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

const valueRender = function (binder: any) {
    const { owner, meta } = binder;
    const { type } = owner;

    if (!meta.setup) {
        meta.setup = true;
        owner.addEventListener('input', (event: Event) => input(binder, event));
    }

    const computed = binder.compute({ event: undefined, $event: undefined, $value: undefined, $checked: undefined, $assignment: false });

    let display;
    if (type === 'select-one') {
        owner.value = undefined;

        Array.prototype.find.call(owner.options, o => '$value' in o ? o.$value : o.value === computed);

        if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
            owner.options[ 0 ].selected = true;
            return owner.dispatchEvent(defaultInputEvent);
        }

        display = format(computed);
        owner.value = display;
    } else if (type === 'select-multiple') {
        Array.prototype.forEach.call(owner.options, o => o.selected = computed?.includes('$value' in o ? o.$value : o.value));
        display = format(computed);
    } else if (type === 'number' || type === 'range' || date.includes(type)) {
        if (typeof computed === 'string') owner.value = computed;
        else owner.valueAsNumber = computed;
        display = owner.value;
    } else {
        display = format(computed);
        owner.value = display;
    }

    owner.$value = computed;
    owner.setAttribute('value', display);

};

const valueUnrender = function (binder: any) {
    const { owner } = binder;
    const { type } = owner;

    if (type === 'select-one' || type === 'select-multiple') {
        Array.prototype.forEach.call(owner.options, option => option.selected = false);
    }

    owner.value = undefined;
    owner.$value = undefined;
    owner.setAttribute('value', '');
};

export default { render: valueRender, unrender: valueUnrender };
