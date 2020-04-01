
export default function absolute (url) {
    if (
        url.indexOf('/') === 0 ||
        url.indexOf('//') === 0 ||
        url.indexOf('://') === 0 ||
        url.indexOf('ftp://') === 0 ||
        url.indexOf('file://') === 0 ||
        url.indexOf('http://') === 0 ||
        url.indexOf('https://') === 0
    ) {
        return true;
    } else {
        return false;
    }
}
