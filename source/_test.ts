import { html, update } from './index.ts';

const items = [ 0, 1, 2 ];

const connected = () => {
    console.log('connected');
    setTimeout(() => {
        // items.push(3, 4, 5, 6, 7, 8, 9);
        items.push(3, 4, 5, 6, 7, 8, 9, 10, 11);
        update();
        setTimeout(() => {
            items.splice(5, 5);
            console.log(items);
            update();
        }, 2000);
    }, 1000);
};

const a = () => {
    return items[ 0 ]++;
};

html`

    <main onConnected=${connected} onAnimation=${a}>

        <ul>${() => items.map(
            item => html`<li>${() => item}</li>`
        )}</ul>

    </main>

`(document.body);

// const token = () => Math.random().toString(36).substring(2, 5);

// const items = Array.from({ length: 500 }, (_, index) => ({ name: token(), id: index }));

// const rename = () => {
//     items.forEach(item => item.name = token());
//     update().then(() => setTimeout(() => rename(), 10));
// };
// const connected = () => {
//     rename();
// };

// html`
//     <style>
//         body {
//             color: lightgray;
//             background: black;
//             box-sizing: border-box;
//         }
//         main {
//             box-sizing: border-box;
//         }
//         ul {
//             box-sizing: border-box;
//             display: flex;
//             flex-wrap: wrap;
//             padding: 0;
//             margin: 0;
//         }
//         li {
//             display: block;
//             width: 10%;
//             padding: 5px;
//             box-sizing: border-box;
//             border: 1px solid lightgray;
//         }
//     </style>

//     <main onConnected=${connected}>
//         <ul>${() => items.map(
//             item => html`<li>${() => item.name}</li>`
//         )}</ul>
//     </main>
// `(document.body);
