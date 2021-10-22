import format from '../format';
import dateTypes from '../types/date';

const defaultInputEvent = new Event('input');

const parseable = function (value) {
    return !isNaN(value) && value !== null && value !== undefined && typeof value !== 'string';
};

const stampFromView = function (data: number) {
    const date = new Date(data);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()).getTime();
};

const stampToView = function (data: number) {
    const date = new Date(data);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(),
        date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())).getTime();
};

const input = async function (binder, event) {
    const { owner } = binder;
    const { type } = owner;
    let display, computed;

    if (type === 'select-one') {
        const [ option ] = owner.selectedOptions;
        const value = option ? '$value' in option ? option.$value : option.value : undefined;
        computed = await binder.compute({ $event: event, $value: value, $assignment: true });
        display = format(computed);
    } else if (type === 'select-multiple') {
        const value = [];
        for (const option of owner.selectedOptions) {
            value.push('$value' in option ? option.$value : option.value);
        }
        computed = await binder.compute({ $event: event, $value: value, $assignment: true });
        display = format(computed);
    } else if (type === 'number' || type === 'range') {
        computed = await binder.compute({ $event: event, $value: owner.valueAsNumber, $assignment: true });
        // if (typeof computed === 'number' && computed !== Infinity) owner.valueAsNumber = computed;
        // else owner.value = computed;
        owner.value = computed;
        display = owner.value;
    } else if (dateTypes.includes(type)) {
        const value = typeof owner.$value === 'string' ? owner.value : stampFromView(owner.valueAsNumber);
        computed = await binder.compute({ $event: event, $value: value, $assignment: true });
        if (typeof owner.$value === 'string') owner.value = computed;
        else owner.valueAsNumber = stampToView(computed);
        display = owner.value;
    } else {
        const value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
        const checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
        computed = await binder.compute({ $event: event, $value: value, $checked: checked, $assignment: true });
        display = format(computed);
        owner.value = display;
    }

    owner.$value = computed;
    if (type === 'checked' || type === 'radio') owner.$checked = computed;
    owner.setAttribute('value', display);
};

const valueRender = async function (binder) {
    const { owner, meta } = binder;

    if (!meta.setup) {
        meta.setup = true;
        meta.nodeName = owner.nodeName;
        owner.addEventListener('input', event => input(binder, event));
    }

    const computed = await binder.compute();

    let display;
    if (binder.owner.type === 'select-one') {
        owner.value = undefined;

        for (const option of owner.options) {
            const optionValue = '$value' in option ? option.$value : option.value;
            if (option.selected = optionValue === computed) break;
        }

        if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
            const [ option ] = owner.options;
            option.selected = true;
            return owner.dispatchEvent(defaultInputEvent);
        }

        display = format(computed);
        owner.value = display;
    } else if (binder.owner.type === 'select-multiple') {

        for (const option of owner.options) {
            const optionValue = '$value' in option ? option.$value : option.value;
            option.selected = computed?.includes(optionValue);
        }

        display = format(computed);
    } else if (binder.owner.type === 'number' || binder.owner.type === 'range') {
        if (typeof computed === 'number' && computed !== Infinity) owner.valueAsNumber = computed;
        else owner.value = computed;
        display = owner.value;
    } else if (dateTypes.includes(binder.owner.type)) {
        if (typeof computed === 'string') owner.value = computed;
        else owner.valueAsNumber = stampToView(computed);
        display = owner.value;
    } else {
        display = format(computed);
        owner.value = display;
    }

    owner.$value = computed;
    if (binder.owner.type === 'checked' || binder.owner.type === 'radio') owner.$checked = computed;
    owner.setAttribute('value', display);

};

const valueUnrender = async function (binder) {

    if (binder.owner.type === 'select-one' || binder.owner.type === 'select-multiple') {
        for (const option of binder.owner.options) {
            option.selected = false;
        }
    }

    binder.owner.value = undefined;
    binder.owner.$value = undefined;
    if (binder.owner.type === 'checked' || binder.owner.type === 'radio') binder.owner.$checked = undefined;
    binder.owner.setAttribute('value', '');
};

export default { render: valueRender, unrender: valueUnrender };
