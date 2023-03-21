
// export default (html, self) => (
//     () => html`
//     <section>
//         <h1>404</h1>
//         <h2>Page Not Found</h2>
//     </section>
// `);

const test = (root, meta = {}, html) => (
    meta.c = () => undefined,
    () => html`
    <section>
        <h1>404</h1>
        <h2>Page Not Found</h2>
    </section>
`);

const data = state();

data.connected = () => console.log('connected');

export default () => html`
<section>
    <h1>404</h1>
    <h2>Page Not Found</h2>
</section>
`;
