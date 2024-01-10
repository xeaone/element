import { TemplateSymbol, BindersCache, VariablesSymbol, InstanceSymbol } from './global';
import { ATTRIBUTE_NODE, afterNode, beforeNode, createAttribute, hasOn, isAnimation, isAttribute, isBool, isComment, isElement, isIterable, isMarker, isText, isTimeout, removeAttribute, removeBetween, removeNode, replaceNode } from './tools';
import { intersectionObserver } from './intersection';
import { update } from './update';
import { Binder } from './types';
import { bind } from './bind';

/**
 * @module Action
 * @todo need to handle element name changes
 * @todo need to handle attribute name changes
 * @todo
 *
 */

const comment = function (node: Comment, binder: Binder, result: any) {
    console.warn('comment action not implemented');
};

const element = function (node:Element, binder: Binder, result: any) {
    console.warn('element action not implemented');
};

const attribute = function (node: Attr, binder: Binder, result: any) {
    const name = node.name;


    if (hasOn(name)) {

        if (isAnimation(name)) {
            // const variable = binder.result;
            const isArray = Array.isArray(binder.result);
            const method = isArray ? binder.result[ 0 ] : binder.result;
            const handle = async () => {
                if (binder.owner?.isConnected) {
                    const result = method();
                    if (binder.result === result) {
                        requestAnimationFrame(handle);
                    } else {
                        binder.result = result;
                        await update();
                        requestAnimationFrame(handle);
                    }
                } else {
                    requestAnimationFrame(handle);
                }
            };
            requestAnimationFrame(handle);
        } else if (isTimeout(name)) {
            // const variable = binder.variable;
            // const isArray = Array.isArray(variable);
            // const method = isArray ? variable[ 0 ] : variable;
            // const time = isArray ? variable[ 1 ] : undefined;

            const isArray = Array.isArray(binder.result);
            const method = isArray ? binder.result[ 0 ] : binder.result;
            const time = isArray ? binder.result[ 1 ] : undefined;
            const handle = async () => {
                const result = method();
                if (binder.result === result) {
                    return;
                } else {
                    binder.result = result;
                    await update();
                }
            };
            setTimeout(handle, time);
        } else {
            const owner = binder.owner;
            if (owner) {
                const eventName = name.substring(2);
                const isArray = Array.isArray(result);
                const [ method, options ] = isArray ? result : [ result, undefined ];
                if (typeof method === 'function') {
                    // owner.removeEventListener(eventName, result);
                    owner.addEventListener(eventName, async function (event) {
                        const returned = method(event);
                        if (binder.meta.returned !== returned) {
                            binder.meta.returned = returned;
                            await update();
                        }
                    }, options);
                    intersectionObserver.observe(owner);
                } else {
                    console.error(`${name} requiures function or array with function`);
                }
            }
        }

        const owner = binder.owner;
        if (owner) {
            owner.removeAttributeNode(node);
        }

    // } else if (isMarker(name)) {
    } else if (node.value === '') {
        console.log(node.name, node.value, name, result);
        if (name !== result) {
            if (result) {
                binder.replace(createAttribute(binder.owner, result));
                removeAttribute(node);
                Reflect.set(binder.owner, result, true);
            } else {
                removeAttribute(node);
                Reflect.set(binder.owner, result, true);
            }
        }
    } else if (result instanceof Attr) {

    } else {
        node.value = result;
    }
};

const text = function (node: Text, binder: Binder, result: any) {

    if (result === null || result === undefined) {
        if (node.textContent === '') {
            return;
        } else {
            node.textContent = '';
        }
    } else if (result instanceof Node) {

        if (!binder.start) {
            binder.start = document.createTextNode('');
            beforeNode(binder.start, node);
        }

        if (!binder.end) {
            node.textContent = '';
            binder.end = node;
        }

        removeBetween(binder.start, binder.end);
        beforeNode(result, binder.end);

    } else if (result?.[ InstanceSymbol ]) {

        if (!binder.start) {
            binder.start = document.createTextNode('');
            beforeNode(binder.start, node);
        }

        if (!binder.end) {
            node.textContent = '';
            binder.end = node;
        }

        removeBetween(binder.start, binder.end);
        beforeNode(result(), binder.end);

    } else if (isIterable(result)) {

        if (binder.length === undefined) {
            binder.length = 0;
        }

        if (!binder.results) {
            binder.results = [];
        }

        if (!binder.markers) {
            binder.markers = [];
        }

        if (!binder.start) {
            binder.start = document.createTextNode('');
            beforeNode(binder.start, node);
        }

        if (!binder.end) {
            node.textContent = '';
            binder.end = node;
        }

        const oldLength = binder.length;
        const newLength = result.length;
        const commonLength = Math.min(oldLength, newLength);

        for (let index = 0; index < commonLength; index++) {

            if (binder.results[ index ]?.[TemplateSymbol] === result[ index ]?.[TemplateSymbol]) {
                Object.assign(binder.results[ index ][VariablesSymbol], result[ index ][VariablesSymbol]);
            } else {
                binder.results[ index ] = result[ index ];
            }

        }

        if (oldLength < newLength) {
            while (binder.length !== result.length) {
                const marker = document.createTextNode('');
                binder.markers.push(marker);
                binder.results.push(result[ binder.length ]);
                beforeNode(marker, binder.end);
                bind(marker, binder.results, binder.length);
                binder.length++;
            }
        } else if (oldLength > newLength) {
            const last = binder.markers[ result.length - 1 ];

            while (binder.length !== result.length) {
                // const previous = binder.end.previousSibling;
                // removeNode(previous as Node);
                // const last = binder.markers[ binder.markers.length - 1 ];
                // if (previous === last) {
                //     binder.markers.pop();
                //     binder.results.pop();
                //     binder.length--;
                // }

                const previous = binder.end.previousSibling;
                if (previous === last) break;
                removeNode(previous as Node);
            }

            binder.length = result.length;
            binder.results.length = result.length;
            binder.markers.length = result.length;
        }

    } else {
        if (node.textContent === `${result}`) {
            return;
        } else {
            node.textContent = `${result}`;
        }
    }
};

export const action = function (binder: Binder) {
    const node = binder.node;

    if (!node) {
        return;
    }

    // this optimization could prevent disconnected nodes from being render when re/connected
    // Note: Attr nodes do not change the isConnected prop
    // if (!node.isConnected && binder.isInitialized) {
    //     return;
    // }

    const variable = binder.variable;
    const isFunction = typeof variable === 'function';
    const isInstance = isFunction && variable[InstanceSymbol];
    const isOnce = node.nodeType === ATTRIBUTE_NODE && (node as Attr)?.name.startsWith('on');
    const isReactive = !isInstance && !isOnce && isFunction;

    // move this to the Binder
    if (!isReactive || isOnce) {
        binder.remove();
    }

    let result: any;
    if (isReactive) {
        result = variable();
    } else {
        result = variable;
    }

    if (binder.result === result) {
        return;
    }

    if (binder.result?.constructor !== result?.constructor) {
        delete binder.start;
        delete binder.end;
        delete binder.markers;
        delete binder.results;
        delete binder.length;
    }

    if (isText(node)) {
        text(node as Text, binder, result);
    } else if (isAttribute(node)) {
        attribute(node as Attr, binder, result);
    } else if (isElement(node)) {
        element(node as Element, binder, result);
    } else if (isComment(node)) {
        comment(node as Comment, binder, result);
    } else {
        console.warn(`action node type "${node.nodeType}" not handled`);
    }

    // if (
    //     binder.result &&
    //     typeof binder.result === 'object' &&
    //     'length' in binder.result &&
    //     result &&
    //     typeof result === 'object' &&
    //     'length' in result
    // ) {
    //     console.log(result);
    // } else {
    //     binder.result = result;
    // }

    binder.result = result;

    // binder.isInitialized = true;

};