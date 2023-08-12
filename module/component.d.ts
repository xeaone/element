/**
 * @version 9.1.1
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
import html from './html';
import { HTML } from './types';
declare const task: unique symbol;
declare const update: unique symbol;
declare const create: unique symbol;
export default class Component extends HTMLElement {
    #private;
    static html: typeof html;
    /**
     * Defines the custom element and return the constructor.
     */
    static define(tag?: string): typeof Component;
    /**
     * Define, Create, Upgrade, and return element.
     */
    static create(tag?: string): HTMLElement;
    /**
     * Define, Create, Upgrade, waits until first render, and return element.
     */
    static upgrade(tag?: string): Promise<HTMLElement>;
    /**
     * Configuration to define a element Tag name for use by the define() and create() method.
     * Default value will use the function.constructor.name.
     */
    protected static tag?: string;
    /**
     * Configuration to use shadow root.
     * Default is false.
     */
    protected static shadow?: boolean;
    /**
     * Configuration of the shadow mode attachment.
     * Default is open.
     */
    protected static mode?: 'open' | 'closed';
    /**
     * Alternative configuration optimization that allows the specific definition of reactive properties on the Element.
     * Default will use getOwnPropertyNames on the Instance and Prototype to redfine properties as reactive.
     */
    protected static observedProperties?: Array<string>;
    /**
     * Invoked when triggered from reactive properties.
     * @category rendering
     */
    protected render?(context: Record<any, any>): HTML | Promise<HTML>;
    /**
     * Called one time when an element is created. Lifecycle: Created -> Connected -> Rendered.
     * @category lifecycle
     */
    protected created?(context: Record<any, any>): void | Promise<void>;
    /**
     * Called every time the element is Connected to a document. Lifecycle: Connected -> Rendered.
     * @category lifecycle
     */
    protected connected?(context: Record<any, any>): void | Promise<void>;
    /**
     * Called every time the element is needs to render. Lifecycle: Rendered.
     * @category lifecycle
     */
    protected rendered?(context: Record<any, any>): void | Promise<void>;
    /**
     * Called every time the element disconnected from a document.
     * @category lifecycle
     */
    protected disconnected?(context: Record<any, any>): void | Promise<void>;
    /**
     * Called every time the element adopted into a new document.
     * @category lifecycle
     */
    protected adopted?(context: Record<any, any>): void | Promise<void>;
    /**
     * Called every an observed attribute changes.
     */
    protected attribute?(name: string, oldValue: string, newValue: string): void | Promise<void>;
    [task]: Promise<void>;
    constructor();
    protected attributeChangedCallback(name: string, oldValue: string, newValue: string): Promise<void>;
    protected adoptedCallback(): Promise<void>;
    protected connectedCallback(): Promise<void>;
    protected disconnectedCallback(): Promise<void>;
    protected [create](): Promise<void>;
    protected [update](): Promise<void>;
}
export {};
