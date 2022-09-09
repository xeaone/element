export default Object.freeze({

    value: Symbol('value'),
    parent: Symbol('parent'),

    parseable (value: any) {
        return !isNaN(value) && value !== undefined && typeof value !== 'string';
    }

});