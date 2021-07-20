import format from '../format';
import numberTypes from '../types/number';

console.warn('need to handle default select-one value');

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
        const value = !option ? undefined : option.$typeof && option.$typeof !== 'string' ? JSON.parse(option.value) : option.value;
        computed = await binder.compute({ event, value });
        display = format(computed);
    } else if (type === 'select-multiple') {

        const value = [];
        for (const option of owner.selectedOptions) {
            value.push(option.$typeof && option.$typeof !== 'string' ? JSON.parse(option.value) : option.value);
        }

        computed = await binder.compute({ event, value });
        display = format(computed);
        // } else if (type === 'file') {
        //     const { multiple, files } = owner;
        //     const value = multiple ? [ ...files ] : files[ 0 ];
        //     const computed = await binder.compute({ event, value });
        //     display = format(computed);
    } else if (type === 'number' || type === 'range') {
        computed = await binder.compute({ event, value: owner.valueAsNumber });
        owner.valueAsNumber = computed;
        display = owner.value;
    } else if (numberTypes.includes(type)) {
        const value = owner.$typeof === 'string' ? owner.value : stampFromView(owner.valueAsNumber);

        computed = await binder.compute({ event, value });

        if (owner.$typeof === 'string') owner.value = computed;
        else owner.valueAsNumber = stampToView(computed);

        display = owner.value;
    } else {
        const { checked } = owner;
        const value = owner.$typeof && owner.$typeof !== 'string' ? JSON.parse(owner.value) : owner.value;
        computed = await binder.compute({ event, value, checked });
        display = format(computed);
        owner.value = display;
    }

    owner.$value = computed;
    owner.$typeof = typeof computed;
    owner.setAttribute('value', display);
};

const value = async function value (binder) {
    const { owner, meta } = binder;
    const { type } = owner;

    if (!meta.setup) {
        meta.setup = true;

        if (type === 'select-one' || type === 'select-multiple') {
            owner.addEventListener('$renderEach', () => binder.render());
            owner.addEventListener('$renderOption', () => binder.render());
        }

        owner.addEventListener('input', event => input(binder, event));
    }

    let display, computed;

    if (type === 'select-one') {
        const value = binder.assignee();

        for (const option of owner.options) {
            if (option.selected = '$value' in option ? option.$value === value : option.value === value) {
                break;
            }
        }

        computed = await binder.compute({ value: value });
        display = format(computed);
        owner.value = display;
    } else if (type === 'select-multiple') {
        const value = binder.assignee();
        const { options } = owner;

        for (const option of options) {
            option.selected = value?.includes('$value' in option ? option.$value : option.value);
        }

        computed = await binder.compute({ value });
        display = format(computed);
    } else if (type === 'number' || type === 'range') {
        const value = binder.assignee();
        computed = await binder.compute({ value });
        owner.valueAsNumber = computed;
        display = owner.value;
    } else if (numberTypes.includes(type)) {
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
    owner.$typeof = typeof computed;
    owner.setAttribute('value', display);

    console.log(owner, owner.$typeof);

    if (!meta.first) {
        meta.first = true;
        if (owner.parentElement.type === 'select-one' || owner.parentElement.type === 'select-multiple') {
            owner.parentElement.dispatchEvent(new Event('$renderOption'));
        }
    }

};

export default value;

// const setup = async function (binder) {
//     binder.owner.addEventListener('$render', () => binder.render());
//     binder.owner.addEventListener('input', event => input(binder, event));
// };

// const read = async function (binder, context) {
//     const { owner } = binder;
//     context.options = owner.options;
//     context.selected = owner.selectedOptions;
// };

// const write = async function (binder, context) {
//     const { owner } = binder;
//     const { type } = owner;

//     let display, computed;

//     if (type === 'select-one') {
//         // if (!context.options.length) return;
//         const value = binder.assignee();

//         for (const option of context.options) {
//             if (option.selected = option.value === value) break;
//         }

//         computed = await binder.compute({ value: value });
//         display = format(computed);
//         owner.value = display;
//     } else if (type === 'select-multiple') {
//         const value = binder.assignee();
//         const { options } = owner;

//         for (const option of options) {
//             option.selected = value?.includes(option.value);
//         }

//         computed = await binder.compute({ value });
//         display = format(computed);
//     } else {
//         const { checked } = owner;
//         const value = binder.assignee();
//         computed = await binder.compute({ value, checked });
//         display = format(computed);
//         if (numberTypes.includes(type) && typeof computed !== 'string') {
//             owner.valueAsNumber = computed;
//         } else {
//             owner.value = display;
//         }
//     }

//     owner.$value = computed;
//     owner.$typeof = typeof computed;
//     owner.setAttribute('value', display);
// };

// export default { setup, read, write };
