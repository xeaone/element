
export default function fetch (url) {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    resolve(xhr.responseText);
                } else {
                    reject(new Error(`failed to import: ${url}`));
                }
            }
        };

        try {
            xhr.open('GET', url, true);
            xhr.send();
        } catch {
            reject(new Error(`failed to import: ${url}`));
        }

    });
}
