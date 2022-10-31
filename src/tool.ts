// export const walk = function (node: Node, method: (node: Node, result: any) => void) {
//     if (node.hasChildNodes()) {
//         let child = node.firstChild;
//         while (child) {
//             method(child, walk(child, method));
//             child = child.nextSibling;
//         }
//     }
// };

export const whitespace = /^\s*$/;
export const textType = Node.TEXT_NODE;
export const elementType = Node.ELEMENT_NODE;
export const commentType = Node.COMMENT_NODE;
export const cdataType = Node.CDATA_SECTION_NODE;

export const parseable = function (value: any) {
    return !isNaN(value) && value !== undefined && typeof value !== 'string';
};

export const display = function (data: any) {
    if (typeof data == 'string') return data;
    if (typeof data == 'undefined') return '';
    if (typeof data == 'object') return JSON.stringify(data);
    return data;
};

export const dash = function (data: string) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
};

// const week = function (data: number) {
//     const date = new Date(data);

//     // find the year of the entered date
//     const oneJan = new Date(date.getFullYear(), 0, 1);

//     // calculating number of days in given year before the given date
//     const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));

//     // adding 1 since to current date and returns value starting from 0
//     return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
// };

const toolDefault = Object.freeze({
    parseable,
    display,
    dash,
});

export default toolDefault;
