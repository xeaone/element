
export default function Walker (node, callback) {

    callback(node);
    node = node.firstChild;

    while (node) {
        Walker(node, callback);
        node = node.nextSibling;
    }

}
