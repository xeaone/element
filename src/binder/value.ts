import format from '../format';

const numberTypes = [ 'date', 'datetime-local', 'month', 'number', 'range', 'time', 'week' ];

const input = async function (binder, event) {
    binder.busy = true;

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
        // } else if (type === 'file') {
        //     const { multiple, files } = owner;
        //     const value = multiple ? [ ...files ] : files[ 0 ];
        //     const computed = await binder.compute({ event, value });
        //     display = format(computed);
    } else {
        const { checked } = owner;
        const isNumberType = numberTypes.includes(type);
        const value = isNumberType ? owner.valueAsNumber : owner.value;
        const computed = await binder.compute({ event, value, checked });
        display = format(computed);
        if (isNumberType) {
            owner.valueAsNumber = computed;
        } else {
            owner.value = display;
        }
    }

    owner.setAttribute('value', display);
    binder.busy = false;
};

const value = {
    async setup (binder) {
        binder.owner.addEventListener('input', event => input(binder, event));
    },
    async write (binder) {
        const { owner } = binder;
        const { type } = owner;

        let display;

        if (type === 'select-one') {
            const value = binder.assignee();
            const { options } = owner;

            for (const option of options) {
                if (option.selected = option.value === value) break;
            }

            const [ option ] = owner.selectedOptions;
            const computed = await binder.compute({ value: option?.value });

            display = format(computed);
            owner.value = display;
        } else if (type === 'select-multiple') {
            const value = binder.assignee();
            const { options } = owner;

            for (const option of options) {
                option.selected = value?.includes(option.value);
            }

            const computed = await binder.compute({ value });
            display = format(computed);
        } else {
            const { checked } = owner;
            const value = binder.assignee();
            const computed = await binder.compute({ value, checked });
            display = format(computed);
            if (numberTypes.includes(type)) {
                owner.valueAsNumber = computed;
            } else {
                owner.value = display;
            }
        }

        owner.setAttribute('value', display);
    }
};

export default value;
