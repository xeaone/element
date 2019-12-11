
export default function walker (node, callback) {

    callback(node);
    node = node.firstChild;

    while (node) {
        walker(node, callback);
        node = node.nextSibling;
    }

}
