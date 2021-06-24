import format from '../format';

// properties to consider: defaultValue, valueAsDate, valueAsNumber

const input = async function (binder, event) {
    const { owner } = binder;
    const { type } = owner;
    let display;

    if (type === 'select-one') {
        const [ option ] = owner.selectedOptions;
        const value = option?.value;
        const computed = await binder.compute({ event, value });
        display = format(computed);
    } else if (type === 'select-multiple') {

        const value = [];
        for (const option of owner.selectedOptions) {
            value.push(option.value);
        }

        const computed = await binder.compute({ event, value });
        display = format(computed);
    } else if (type === 'file') {
        const { multiple, files } = owner;
        const value = multiple ? [ ...files ] : files[ 0 ];
        const computed = await binder.compute({ event, value });
        display = format(computed);
    } else if (type === 'number') {
        const value = Number(owner.value);
        const computed = await binder.compute({ event, value });
        display = format(computed);
    } else {
        const { value, checked } = owner;
        const computed = await binder.compute({ event, value, checked });
        display = format(computed);
        owner.value = display;
    }

    owner.setAttribute('value', display);
};

const value = {
    async setup (binder) {
        binder.owner.addEventListener('input', event => input(binder, event));
    },
    async write (binder) {
        const { owner } = binder;
        const { type } = owner;

        const value = binder.assignee();
        const event = { target: { value } };
        let display;

        if (type === 'select-one' || type === 'select-multiple') {
            const { multiple, options } = owner;
            owner.selectedIndex = -1;

            for (const option of options) {
                option.selected = multiple ? value?.includes(option.value) : option.value === value;
                if (!multiple && option.selected) break;
            }

            let computed;
            if (!multiple && owner.selectedIndex === -1 && value === undefined) {
                const [ option ] = owner.options;
                computed = await binder.compute({ value: option?.value });
            } else {
                computed = await binder.compute({ value });
            }

            display = format(computed);
            if (!multiple) owner.value = display;

        } else {
            const { checked } = owner;
            const computed = await binder.compute({ event, value, checked });
            display = format(computed);
            owner.value = display;
        }

        owner.setAttribute('value', display);
    }
};

export default value;
