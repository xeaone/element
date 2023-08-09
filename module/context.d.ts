type ContextMethod = () => void;
type ContextData = Record<string, any>;
declare const Context: (data: ContextData, method: ContextMethod) => Record<any, any>;
export default Context;
