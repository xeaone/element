
const single = '/';
const double = '//';
const colon = '://';
const ftp = 'ftp://';
const file = 'file://';
const http = 'http://';
const https = 'https://';

export default function absolute (path:string) {
    if (
        path.slice(0, single.length) === single ||
        path.slice(0, double.length) === double ||
        path.slice(0, colon.length) === colon ||
        path.slice(0, ftp.length) === ftp ||
        path.slice(0, file.length) === file ||
        path.slice(0, http.length) === http ||
        path.slice(0, https.length) === https 
    ) {
        return true;
    } else {
        return false;
    }
}
