/**
* @version 10.0.5
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { Binder, BinderType, ReferenceType, Variables } from './types';
export declare const bind: (type: BinderType, index: number, variables: Variables, referenceNode: ReferenceType<Node>, referenceName?: ReferenceType<any>, referenceValue?: ReferenceType<any>) => Binder;
