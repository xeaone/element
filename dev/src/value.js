import format from './format.js';
import dates from './dates.js';

console.warn('value: setter/getter issue with multiselect');

const defaultInputEvent = new Event('input');

const parseable = function (value) {
    return !isNaN(value) && value !== null && value !== undefined && typeof value !== 'string';
};

const stampFromView = function (data) {
    const date = new Date(data);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()).getTime();
};

const stampToView = function (data) {
    const date = new Date(data);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(),
        date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())).getTime();
};

const input = function (binder, event) {
    let display, computed;

    if (binder.node.type === 'select-one') {
        const [ option ] = binder.node.selectedOptions;
        const value = option ? '$value' in option ? option.$value : option.value : undefined;
        computed = binder.compute({ $event: event, $value: value, $assignment: true });
        display = format(computed);
    } else if (binder.node.type === 'select-multiple') {
        const value = [];
        for (const option of binder.node.selectedOptions) {
            value.push('$value' in option ? option.$value : option.value);
        }
        computed = binder.compute({ $event: event, $value: value, $assignment: true });
        display = format(computed);
    } else if (binder.node.type === 'number' || binder.node.type === 'range') {
        computed = binder.compute({ $event: event, $value: binder.node.valueAsNumber, $assignment: true });
        // if (binder.node.typeof computed === 'number' && computed !== Infinity) binder.node.valueAsNumber = computed;
        // else binder.node.value = computed;
        binder.node.value = computed;
        display = binder.node.value;
    } else if (dates.includes(binder.node.type)) {
        const value = typeof binder.node.$value === 'string' ? binder.node.value : stampFromView(binder.node.valueAsNumber);
        computed = binder.compute({ $event: event, $value: value, $assignment: true });
        if (typeof binder.node.$value === 'string') binder.node.value = computed;
        else binder.node.valueAsNumber = stampToView(computed);
        display = binder.node.value;
    } else {
        const value = '$value' in binder.node && parseable(binder.node.$value) ? JSON.parse(binder.node.value) : binder.node.value;
        const checked = '$value' in binder.node && parseable(binder.node.$value) ? JSON.parse(binder.node.checked) : binder.node.checked;
        computed = binder.compute({ $event: event, $value: value, $checked: checked, $assignment: true });
        display = format(computed);
        binder.node.value = display;
    }

    binder.node.$value = computed;
    if (binder.node.type === 'checked' || binder.node.type === 'radio') binder.node.$checked = computed;
    binder.node.setAttribute('value', display);
};

const valueRender = function (binder) {

    if (!binder.setup) {
        binder.setup = true;
        binder.node.addEventListener('input', function valueRenderInputEvent (event) {
            input(binder, event);
        });
    }

    const computed = binder.compute();

    let display;
    if (binder.node.type === 'select-one') {
        binder.node.value = undefined;

        for (const option of binder.node.options) {
            const optionValue = '$value' in option ? option.$value : option.value;
            if (option.selected = optionValue === computed) break;
        }

        if (computed === undefined && binder.node.options.length && !binder.node.selectedOptions.length) {
            const [ option ] = binder.node.options;
            option.selected = true;
            return binder.node.dispatchEvent(defaultInputEvent);
        }

        display = format(computed);
        binder.node.value = display;
    } else if (binder.node.type === 'select-multiple') {
        for (const option of binder.node.options) {
            const optionValue = '$value' in option ? option.$value : option.value;
            option.selected = computed?.includes(optionValue);
        }

        display = format(computed);
    } else if (binder.node.type === 'number' || binder.node.type === 'range') {
        if (typeof computed === 'number' && computed !== Infinity) binder.node.valueAsNumber = computed;
        else binder.node.value = computed;
        display = binder.node.value;
    } else if (dates.includes(binder.node.type)) {
        if (typeof computed === 'string') binder.node.value = computed;
        else binder.node.valueAsNumber = stampToView(computed);
        display = binder.node.value;
    } else {
        display = format(computed);
        binder.node.value = display;
    }

    binder.node.$value = computed;
    if (binder.node.type === 'checked' || binder.node.type === 'radio') binder.node.$checked = computed;
    binder.node.setAttribute('value', display);

};

const valueDerender = function (binder) {

    if (binder.node.type === 'select-one' || binder.node.type === 'select-multiple') {
        for (const option of binder.node.options) {
            option.selected = false;
        }
    }

    binder.node.value = undefined;
    binder.node.$value = undefined;
    if (binder.node.type === 'checked' || binder.node.type === 'radio') binder.node.$checked = undefined;
    binder.node.setAttribute('value', '');
};

export default { render: valueRender, derender: valueDerender };