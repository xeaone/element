/**
* @version 10.0.3
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
/**
 * @type {NodeFilter.SHOW_TEXT}
 */
export declare const SHOW_TEXT = 4;
/**
 * @type {NodeFilter.SHOW_ELEMENT}
 */
export declare const SHOW_ELEMENT = 1;
/**
 * @type {Node.TEXT_NODE}
 */
export declare const TEXT_NODE = 3;
/**
 * @type {Node.COMMENT_NODE}
 */
export declare const COMMENT_NODE = 3;
/**
 * @type {Node.ELEMENT_NODE}
 */
export declare const ELEMENT_NODE = 1;
/**
 * @type {Node.ATTRIBUTE_NODE}
 */
export declare const ATTRIBUTE_NODE = 2;
/**
 * @type {Node.DOCUMENT_FRAGMENT_NODE}
 */
export declare const DOCUMENT_FRAGMENT_NODE = 11;
export declare const isLink: (data: string) => boolean;
export declare const isBool: (data: string) => boolean;
export declare const isIterable: (data: any) => boolean;
export declare const isAnimation: (data: string) => boolean;
export declare const isOnce: (data: string) => boolean;
export declare const isTimeout: (data: string) => boolean;
export declare const isValue: (data: string) => boolean;
export declare const hasOn: (data: string) => boolean;
export declare const isMarker: (data: string) => boolean;
export declare const matchMarker: (data: string, marker: string) => boolean;
export declare const hasMarker: (data: string, marker: string) => boolean;
export declare const sliceOn: (data: string) => string;
export declare const isConnected: (node: Node) => boolean;
export declare const mark: () => string;
export declare const dangerousLink: (data: string) => boolean;
/**
 *  DOM mod methods
 */
export declare const removeBetween: (start: Node, end: Node) => void;
export declare const removeNode: (node: Node) => void;
export declare const beforeNode: (node: Node | string, child: Node) => void;
export declare const afterNode: (node: Node | string, child: Node) => void;
export declare const replaceNode: (node: Node, child: Node) => void;
export declare const replaceChildren: (element: Element | Document | DocumentFragment, ...nodes: (Node | string)[]) => void;
/**
 * Attr DOM
 */
export declare const addAttribute: (owner: Element, attribute: Attr) => Attr;
export declare const createAttribute: (owner: Element, name: string, value?: string) => Attr;
export declare const removeAttribute: (node: Attr) => Attr;
/**
 * Node methods
 */
export declare const isText: (node: Node | null) => boolean;
export declare const isAttribute: (node: Node | null) => boolean;
export declare const isElement: (node: Node | null) => boolean;
export declare const isComment: (node: Node | null) => boolean;
