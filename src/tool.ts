// export const whitespace = /^\s*$/;
// export const textType = Node.TEXT_NODE;
// export const elementType = Node.ELEMENT_NODE;
// export const commentType = Node.COMMENT_NODE;
// export const documentType = Node.DOCUMENT_NODE;
// export const cdataType = Node.CDATA_SECTION_NODE;
// export const fragmentType = Node.DOCUMENT_FRAGMENT_NODE;

// export const parseable = function (value: any) {
//     return !isNaN(value) && value !== undefined && typeof value !== 'string';
// };

export const $ = Symbol('$');

export const NameSymbol = Symbol('name');
export const ValueSymbol = Symbol('value');
export const SelfSymbol = Symbol('self');

export const CdataSymbol = Symbol('cdata');
export const CommentSymbol = Symbol('comment');

export const TypeSymbol = Symbol('type');
export const ElementSymbol = Symbol('element');
export const ChildrenSymbol = Symbol('children');
export const AttributesSymbol = Symbol('attributes');
export const ParametersSymbol = Symbol('parameters');

export const RenderCache = new WeakMap();

export const NumberAttributes = [
    'range',
    'number',
];

export const DateAttributes = [
    'datetime-local',
    'date',
    'month',
    'time',
    'week',
];

export const BooleanAttributes = [
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'compact',
    'controls',
    'declare',
    'default',
    'defaultchecked',
    'defaultmuted',
    'defaultselected',
    'defer',
    'disabled',
    'draggable',
    'enabled',
    'formnovalidate',
    'indeterminate',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nohref',
    'noresize',
    'noshade',
    'hidden',
    'novalidate',
    'nowrap',
    'open',
    'pauseonexit',
    'readonly',
    'required',
    'reversed',
    'scoped',
    'seamless',
    'selected',
    'sortable',
    'spellcheck',
    'translate',
    'truespeed',
    'typemustmatch',
    'visible',
];
