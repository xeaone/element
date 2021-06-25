import format from '../format';

const numberTypes = [ 'date', 'datetime-local', 'month', 'number', 'range', 'time', 'week' ];

const input = async function (binder, event) {
    binder.busy = true;

    const { owner } = binder;
    const { type } = owner;
    let display, computed;

    if (type === 'select-one') {
        const [ option ] = owner.selectedOptions;
        const value = option?.value;
        computed = await binder.compute({ event, value });
        display = format(computed);
    } else if (type === 'select-multiple') {

        const value = [];
        for (const option of owner.selectedOptions) {
            value.push(option.value);
        }

        computed = await binder.compute({ event, value });
        display = format(computed);
        // } else if (type === 'file') {
        //     const { multiple, files } = owner;
        //     const value = multiple ? [ ...files ] : files[ 0 ];
        //     const computed = await binder.compute({ event, value });
        //     display = format(computed);
    } else {
        const { checked } = owner;
        const isNumber = owner.$typeof !== 'string' && numberTypes.includes(type);
        const value = isNumber ? owner.valueAsNumber : owner.value;
        computed = await binder.compute({ event, value, checked });
        display = format(computed);
        if (numberTypes.includes(type) && typeof computed !== 'string') {
            owner.valueAsNumber = computed;
        } else {
            owner.value = display;
        }
    }

    owner.$value = computed;
    owner.$typeof = typeof computed;
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

        let display, computed;

        if (type === 'select-one') {
            const value = binder.assignee();
            const { options } = owner;

            for (const option of options) {
                if (option.selected = option.value === value) break;
            }

            const [ option ] = owner.selectedOptions;
            computed = await binder.compute({ value: option?.value });

            display = format(computed);
            owner.value = display;
        } else if (type === 'select-multiple') {
            const value = binder.assignee();
            const { options } = owner;

            for (const option of options) {
                option.selected = value?.includes(option.value);
            }

            computed = await binder.compute({ value });
            display = format(computed);
        } else {
            const { checked } = owner;
            const value = binder.assignee();
            computed = await binder.compute({ value, checked });
            display = format(computed);
            if (numberTypes.includes(type) && typeof computed !== 'string') {
                owner.valueAsNumber = computed;
            } else {
                owner.value = display;
            }
        }

        owner.$value = computed;
        owner.$typeof = typeof computed;
        owner.setAttribute('value', display);
    }
};

export default value;
