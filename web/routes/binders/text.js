
export default {
    title: 'Text Binder',
    name: 'r-binder-text',
    model: {
        templateVar: '<div>{{templateVar}}<div>',
        attributeVar: '<div o-text="attributeVar"></div>'
    },
    template: /*html*/`

        <h2>Text Binder</h2>
        <hr>

        <strong>Template Style: </strong>
        <span>{{templateVar}}</span>

        <br>
        <br>

        <strong>Attribute Style: </strong>
        <span o-text="attributeVar"></span>

    `
};
