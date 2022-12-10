// import tool from './tool.ts';
import { BinderType } from './types.ts';

// interface Target extends HTMLElement {
//     form: HTMLFormElement;
// }

// interface Child extends HTMLElement {
//     type: string;
//     name: string;
//     value: string;
//     checked: boolean;
//     valueAsNumber: number;
//     selectedIndex: number;
//     selectedOptions: NodeListOf<Child>;
//     [key: symbol]: any;
// }

// const onValue = function (element: Child) {
//     if (!element) return undefined;

//     if (tool.value in element) {
//         return tool.parseable(element[tool.value]) ? JSON.parse(JSON.stringify(element[tool.value])) : element[tool.value];
//     }

//     if (element.type === 'number' || element.type === 'range') {
//         return element.valueAsNumber;
//     }

//     return element.value;
// };

// const onSubmitHandler = async function (event: SubmitEvent, binder: BinderType) {
//     event.preventDefault();

//     const form: Record<string, any> = {};
//     const target = (event.target as Target)?.form || event.target as HTMLFormElement;
//     const elements: NodeListOf<Child> = target?.querySelectorAll('[name]');

//     for (const element of elements) {
//         const { type, name, checked } = element;

//         if (!name) continue;
//         if (type === 'radio' && !checked) continue;
//         if (type === 'submit' || type === 'button') continue;

//         let value: string | string[];
//         if (type === 'select-multiple') {
//             value = [];
//             for (const option of element.selectedOptions) {
//                 value.push(onValue(option));
//             }
//         } else if (type === 'select-one') {
//             const [option] = element.selectedOptions;
//             value = onValue(option);
//         } else {
//             value = onValue(element);
//         }

//         let data = form;
//         const parts = name.split(/\s*\.\s*/);
//         for (let index = 0; index < parts.length; index++) {
//             const part = parts[index];
//             const next = parts[index + 1];
//             if (next) {
//                 if (!data[part]) {
//                     data[part] = /[0-9]+/.test(next) ? [] : {};
//                 }
//                 data = data[part];
//             } else {
//                 data[part] = value;
//             }
//         }
//     }

//     binder.instance.$form = form;

//     await binder.compute();

//     if (target.hasAttribute('reset')) {
//         for (const element of elements) {
//             const { type, name } = element;
//             if (!name) continue;
//             else if (type === 'submit' || type === 'button') continue;
//             else if (type === 'select-one') element.selectedIndex = 0;
//             else if (type === 'select-multiple') element.selectedIndex = -1;
//             else if (type === 'radio' || type === 'checkbox') element.checked = false;
//             else element.value = '';
//             element.dispatchEvent(new Event('input'));
//         }
//     }

//     return false;
// };

// const onResetHandler = async function (event: Event, binder: BinderType) {
//     event.preventDefault();

//     const target = (event.target as Target)?.form || event.target as HTMLFormElement;
//     const elements: NodeListOf<Child> = target?.querySelectorAll('[name]');

//     for (const element of elements) {
//         const { type, name } = element;
//         if (!name) continue;
//         else if (type === 'submit' || type === 'button') continue;
//         else if (type === 'select-one') element.selectedIndex = 0;
//         else if (type === 'select-multiple') element.selectedIndex = -1;
//         else if (type === 'radio' || type === 'checkbox') element.checked = false;
//         else element.value = '';
//         element.dispatchEvent(new Event('input'));
//     }

//     await binder.compute();

//     return false;
// };

const onSetup = function (binder: BinderType) {
    // binder.owner[binder.name] = undefined;
    binder.meta.name = binder.name.slice(2);
};

const onRender = function (binder: BinderType) {
    if (binder.meta.method) {
        binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
    }

    binder.meta.method = async (event: Event) => {
        let result;

        binder.instance.event = event;

        // if (binder.meta.name === 'reset') {
        //     result = await onResetHandler(event, binder);
        // } else if (binder.meta.name === 'submit') {
        //     result = await onSubmitHandler(event as SubmitEvent, binder);
        // } else {
        result = await binder.compute();
        // }

        binder.instance.event = undefined;

        return result;
    };

    binder.owner.addEventListener(binder.meta.name, binder.meta.method);
};

const onReset = function (binder: BinderType) {
    if (binder.meta.method) {
        binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
    }
};

const onDefault = { setup: onSetup, render: onRender, reset: onReset };

export default onDefault;
