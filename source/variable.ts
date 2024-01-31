export const Variable = function (index: number, variables: any[]) {
    return {
        get() {
            return variables[index];
        },
        set(value: any) {
            variables[index] = value;
            return value;
        },
    };
};
