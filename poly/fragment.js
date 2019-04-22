
(function (window) { 'use strict';

    if (!('firstElementChild' in window.DocumentFragment.prototype)) {
        Object.defineProperty(window.DocumentFragment.prototype, 'firstElementChild', {
            get: function () {
                var node, nodes = this.childNodes, i = 0;
                while (node = nodes[i++]) {
                    if (node.nodeType === 1) {
                        return node;
                    }
                }
                return null;
            }
        });
    }

    if (!('children' in window.DocumentFragment.prototype)) {
        Object.defineProperty(window.DocumentFragment.prototype, 'children', {
            get: function () {
                var i = 0, node, nodes = this.childNodes, children = [];
                while (node = nodes[i++]) {
                    if (node.nodeType === 1) {
                        children.push(node);
                    }
                }
                return children;
            }
        });
    }

    if (!('lastElementChild' in window.DocumentFragment.prototype)) {
        Object.defineProperty(window.DocumentFragment.prototype, 'lastElementChild', {
            get: function () {
                var node, nodes = this.childNodes, i = nodes.length - 1;
                while (node = nodes[i--]) {
                    if (node.nodeType === 1) {
                        return node;
                    }
                }
                return null;
            }
        });
    }

    if (!('childElementCount' in window.DocumentFragment.prototype)) {
        Object.defineProperty(window.DocumentFragment.prototype, 'childElementCount', {
            get: function () {
                var i = 0, count = 0, node, nodes = this.childNodes;
                while (node = nodes[i++]) {
                    if (node.nodeType === 1) count++;
                }
                return count;
            }
        });
    }

})(window);
