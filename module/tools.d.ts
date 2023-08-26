/**
 * @version 9.1.4
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
export declare const isLink: (data: string) => boolean;
export declare const isBool: (data: string) => boolean;
export declare const isValue: (data: string) => boolean;
export declare const hasOn: (data: string) => boolean;
export declare const sliceOn: (data: string) => string;
export declare const isMarker: (data: string, marker: string) => boolean;
export declare const hasMarker: (data: string, marker: string) => boolean;
export declare const includes: (item: string | Array<any>, search: any) => boolean;
export declare const dangerousLink: (data: string) => boolean;
export declare const removeBetween: (start: Node, end: Node) => void;
