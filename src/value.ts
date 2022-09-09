import utility from './utility';
import date from './date';

const valueEvent = new Event('input');

const valueDisplay = function (data: any) {
    return typeof data == 'string' ? data :
        typeof data == 'undefined' ? '' :
            typeof data == 'object' ? JSON.stringify(data) :
                data;
};

const valueInput = function (binder: any, event: Event) {

    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = true;

    if (binder.owner.type === 'select-one') {
        const [ option ] = binder.owner.selectedOptions;
        binder.instance.$value = option ? utility.value in option ? option[ utility.value ] : option.value : undefined;
        binder.owner[ utility.value ] = binder.compute();
    } else if (binder.owner.type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(binder.owner.selectedOptions, o => utility.value in o ? o[ utility.value ] : o.value);
        binder.owner[ utility.value ] = binder.compute();
    } else if (binder.owner.type === 'number' || binder.owner.type === 'range' || date.includes(binder.owner.type)) {
        binder.instance.$value = utility.value in binder.owner && typeof binder.owner[ utility.value ] === 'number' ? binder.owner.valueAsNumber : binder.owner.value;
        binder.owner[ utility.value ] = binder.compute();
    } else if (binder.owner.nodeName == 'OPTION') {
        throw 'option event';
    } else {
        binder.instance.$value = utility.value in binder.owner && utility.parseable(binder.owner[ utility.value ]) ? JSON.parse(binder.owner.value) : binder.owner.value;
        binder.instance.$checked = utility.value in binder.owner && utility.parseable(binder.owner[ utility.value ]) ? JSON.parse(binder.owner.checked) : binder.owner.checked;
        binder.owner[ utility.value ] = binder.compute();
    }

};

export default {

    setup (binder: any) {
        binder.owner.value = '';
        binder.meta.type = binder.owner.type;
        binder.owner.addEventListener('input', (event: any) => valueInput(binder, event));
    },

    render (binder: any) {

        binder.instance.$assign = false;
        binder.instance.event = undefined;
        binder.instance.$event = undefined;
        binder.instance.$value = undefined;
        binder.instance.$checked = undefined;
        const computed = binder.compute();

        let display;

        if (binder.meta.type === 'select-one') {

            for (const option of binder.owner.options) {
                option.selected = utility.value in option ? option[ utility.value ] === computed : option.value === computed;
            }

            if (computed === undefined && binder.owner.options.length && !binder.owner.selectedOptions.length) {
                binder.owner.options[ 0 ].selected = true;
                return binder.owner.dispatchEvent(valueEvent);
            }

            display = valueDisplay(computed);
            binder.owner.value = display;
        } else if (binder.meta.type === 'select-multiple') {

            for (const option of binder.owner.options) {
                option.selected = computed?.includes(utility.value in option ? option[ utility.value ] : option.value);
            }

            display = valueDisplay(computed);
        } else if (binder.meta.type === 'number' || binder.meta.type === 'range' || date.includes(binder.meta.type)) {

            if (typeof computed === 'string') binder.owner.value = computed;
            else if (typeof computed === 'number' && !isNaN(computed)) binder.owner.valueAsNumber = computed;
            else binder.owner.value = '';

            display = binder.owner.value;
        } else {

            if (binder.owner.nodeName == 'OPTION') {

                const parent = binder.owner?.parentElement?.nodeName === 'SELECT' ? binder.owner.parentElement :
                    binder.owner?.parentElement?.parentElement?.nodeName === 'SELECT' ? binder.owner.parentElement.parentElement :
                        binder.owner?.[ utility.parent ]?.nodeName === 'SELECT' ? binder.owner[ utility.parent ] :
                            null;

                const value = utility.value in parent ? parent[ utility.value ] : parent.value;

                if (value === computed) binder.owner.selected = true;

            }

            display = valueDisplay(computed);
            binder.owner.value = display;
        }

        binder.owner[ utility.value ] = computed;
        binder.owner.setAttribute('value', display);
    },

    reset (binder: any) {

        if (binder.meta.type === 'select-one' || binder.meta.type === 'select-multiple') {
            for (const option of binder.owner.options) {
                option.selected = false;
            }
        }

        binder.owner.value = '';
        binder.owner.setAttribute('value', '');
        binder.owner[ utility.value ] = undefined;
    }

};