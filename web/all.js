
export const context = () => ({});

export const content = (html) => html`
    <section>
        <h1>404</h1>
        <h2>Page Not Found</h2>
    </section>
`;

/*
export default ((c, a, b) => html`
    <section>
        ${a} ${b} ${c.foo}
        <h1>404</h1>
        <h2>Page Not Found</h2>
    </section>
`)({
    foo: 'bar'
});
*/
