
var KEBAB = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g;

function toKebabCase (string) {
    return string.replace(KEBAB, function (match) {
        return '-' + match.toLowerCase();
    });
}

function toHtml (data) {
    if (typeof data === 'string') {
        return document.createTextNode(data);
    } else {
        var node = document.createElement(data.name);

        var attributes = data.attributes;
        if (attributes) {
            for (var name in attributes) {
                node.setAttribute(toKebabCase(name), attributes[name]);
            }
        }

        var children = data.children;
        if (children) {
            if (children.constructor === Array) {
                for (var i = 0, l = children.length; i < l; i++) {
                    node.appendChild(toHtml(children[i]));
                }
            } else {
                node.appendChild(toHtml(children));
            }
        }

        return node;
    }
}

var h = {
    name: 'fieldset',
    attributes: {
        jValue: 'value'
    },
    children: [
        {
            name: 'input',
            attributes: {
                jValue: 'foo.poo'
            }
        },
        {
            name: 'input',
            attributes: {
                jValue: 'bar.dar'
            }
        },
        {
            name: 'div',
            children: 'hello world'
        }
    ]
};

console.log(toHtml(h));
