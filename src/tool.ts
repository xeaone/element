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

const toolDefault = Object.freeze({
    parseable,
    display,
    dash,
});

export default toolDefault;
