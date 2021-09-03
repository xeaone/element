import format from '../format';
import dateTypes from '../types/date';

console.warn('might need to buble up option value change to select');

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
        computed = await binder.compute({ event, value });
        display = format(computed);
    } else if (type === 'select-multiple') {

        const value = [];
        for (const option of owner.selectedOptions) {
            value.push('$value' in option ? option.$value : option.value);
        }

        computed = await binder.compute({ event, value });
        display = format(computed);
    } else if (type === 'number' || type === 'range') {
        computed = await binder.compute({ event, value: owner.valueAsNumber });
        if (typeof computed === 'number' && computed !== Infinity) owner.valueAsNumber = computed;
        else owner.value = computed;
        display = owner.value;
    } else if (dateTypes.includes(type)) {
        const value = typeof owner.$value === 'string' ? owner.value : stampFromView(owner.valueAsNumber);
        computed = await binder.compute({ event, value });
        if (typeof owner.$value === 'string') owner.value = computed;
        else owner.valueAsNumber = stampToView(computed);
        display = owner.value;
    } else {
        const { checked } = owner;
        const value = owner.$value !== null && owner.$value !== undefined && typeof owner.$value !== 'string' ? JSON.parse(owner.value) : owner.value;
        computed = await binder.compute({ event, value, checked });
        display = format(computed);
        owner.value = display;
    }

    owner.$value = computed;
    owner.setAttribute('value', display);
};

const value = async function value (binder) {
    window.requestAnimationFrame(async () => {
        const { owner, meta } = binder;

        if (!meta.setup) {
            meta.setup = true;
            meta.type = owner.type;
            meta.nodeName = owner.nodeName;
            owner.addEventListener('input', event => input(binder, event));
        }

        const { type } = meta;

        let display, computed;

        if (type === 'select-one') {
            let value = binder.assignee();

            owner.value = undefined;

            for (const option of owner.options) {
                const optionValue = '$value' in option ? option.$value : option.value;
                if (option.selected = optionValue === value) break;
            }

            if (owner.options.length && !owner.selectedOptions.length) {
                const [ option ] = owner.options;
                value = '$value' in option ? option.$value : option.value;
                option.selected = true;
            }

            computed = await binder.compute({ value });
            display = format(computed);
            owner.value = display;
        } else if (type === 'select-multiple') {
            const value = binder.assignee();

            for (const option of owner.options) {
                const optionValue = '$value' in option ? option.$value : option.value;
                option.selected = value?.includes(optionValue);
            }

            computed = await binder.compute({ value });
            display = format(computed);
        } else if (type === 'number' || type === 'range') {
            const value = binder.assignee();
            computed = await binder.compute({ value });
            if (typeof computed === 'number' && computed !== Infinity) owner.valueAsNumber = computed;
            else owner.value = computed;
            display = owner.value;
        } else if (dateTypes.includes(type)) {
            const value = binder.assignee();
            computed = await binder.compute({ value });
            if (typeof computed === 'string') owner.value = computed;
            else owner.valueAsNumber = stampToView(computed);
            display = owner.value;
        } else {
            const { checked } = owner;
            const value = binder.assignee();
            computed = await binder.compute({ value, checked });
            display = format(computed);
            owner.value = display;
        }

        owner.$value = computed;
        owner.setAttribute('value', display);

    });
};

export default value;
