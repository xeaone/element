import date from './date';

const defaultInputEvent = new Event('input');

const parseable = function (value: any) {
    return !isNaN(value) && value !== undefined && typeof value !== 'string';
};

const input = function (binder: any, event: Event) {

    binder.instance.$event = event;
    binder.instance.$assign = true;

    if (binder.owner.type === 'select-one') {
        const [ option ] = binder.owner.selectedOptions;
        binder.instance.$value = option ? '$value' in option ? option.$value : option.value : undefined;
        binder.owner.$value = binder.compute();
    } else if (binder.owner.type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(binder.owner.selectedOptions, o => '$value' in o ? o.$value : o.value);
        binder.owner.$value = binder.compute();
    } else if (binder.owner.type === 'number' || binder.owner.type === 'range' || date.includes(binder.owner.type)) {
        binder.instance.$value = '$value' in binder.owner && typeof binder.owner.$value === 'number' ? binder.owner.valueAsNumber : binder.owner.value;
        binder.owner.$value = binder.compute();
    } else {
        binder.instance.$value = '$value' in binder.owner && parseable(binder.owner.$value) ? JSON.parse(binder.owner.value) : binder.owner.value;
        binder.instance.$checked = '$value' in binder.owner && parseable(binder.owner.$value) ? JSON.parse(binder.owner.checked) : binder.owner.checked;
        binder.owner.$value = binder.compute();
    }

};

export default {

    setup (binder: any) {
        binder.owner.value = '';
        binder.meta.type = binder.owner.type;
        binder.owner.addEventListener('input', (event: any) => input(binder, event));
    },

    render (binder: any) {

        binder.instance.$assign = false;
        binder.instance.$event = undefined;
        binder.instance.$value = undefined;
        binder.instance.$checked = undefined;
        const computed = binder.compute();

        let display;

        if (binder.meta.type === 'select-one') {

            Array.prototype.find.call(binder.owner.options, o =>
                '$value' in o ? o.$value : o.value === computed
            );

            if (computed === undefined && binder.owner.options.length && !binder.owner.selectedOptions.length) {
                binder.owner.options[ 0 ].selected = true;
                return binder.owner.dispatchEvent(defaultInputEvent);
            }

            display =
                typeof computed == 'string' ? computed :
                    typeof computed == 'undefined' ? '' :
                        typeof computed == 'object' ? JSON.stringify(computed) : computed;

            binder.owner.value = display;
        } else if (binder.meta.type === 'select-multiple') {

            Array.prototype.forEach.call(binder.owner.options, o =>
                o.selected = computed?.includes('$value' in o ? o.$value : o.value)
            );

            display =
                typeof computed == 'string' ? computed :
                    typeof computed == 'undefined' ? '' :
                        typeof computed == 'object' ? JSON.stringify(computed) : computed;

        } else if (binder.meta.type === 'number' || binder.meta.type === 'range' || date.includes(binder.meta.type)) {

            if (typeof computed === 'string') binder.owner.value = computed;
            else if (typeof computed === 'number' && !isNaN(computed)) binder.owner.valueAsNumber = computed;
            else binder.owner.value = '';

            display = binder.owner.value;
        } else {

            display =
                typeof computed == 'string' ? computed :
                    typeof computed == 'undefined' ? '' :
                        typeof computed == 'object' ? JSON.stringify(computed) : computed;

            binder.owner.value = display;
        }

        binder.owner.$value = computed;
        binder.owner.setAttribute('value', display);
    },

    reset (binder: any) {

        if (binder.meta.type === 'select-one' || binder.meta.type === 'select-multiple') {
            Array.prototype.forEach.call(binder.owner.options, option =>
                option.selected = false
            );
        }

        binder.owner.value = '';
        binder.owner.$value = undefined;
        binder.owner.setAttribute('value', '');
    }

};

