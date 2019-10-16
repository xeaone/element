

export default {

    create (source, handler, path) {
        const self = this;

        if (!source || source.constructor !== Object && source.constructor !== Array) {
            return source;
        }

        path = path ? path + '.' : '';

        const type = source.constructor;
        const target = new Proxy(source.constructor(), {
            set (t, property, value) {

                if (!property in t) {
                    value = self.create(value, handler, path + property + '.');
                }

                if (property === 'length') {
                    handler(t, path.slice(0, -1));
                } else {
                    handler(value, path + property);
                }

                t[property] = value;

                return true;
            },
            get (t, property) {
                return t[property];
            }
        });

        if (type === Array) {
            for (let key = 0, length = source.length; key < length; key++) {
                target[key] = this.create(source[key], handler, path + key);
            }
        }

        if (type === Object) {
            for (let key in source) {
                descriptors.$meta.value[key] = this.create(source[key], handler, path + key);
                descriptors[key] = this.descriptor(key);
            }
        }

        return target;

        // return new Proxy(source, {
        //
        //     set (target, property, value) {
        //         console.log('set',path+property);
        //
        //         if (
        //             (property in target === false) &&
        //             (value instanceof Object || value instanceof Array)
        //         ) {
        //             // console.log(property);
        //             // console.log('create');
        //             value = self.create(value, handler, path + property + '.');
        //         }
        //
        //         if (property === 'length') {
        //             handler(target, path.slice(0, -1));
        //         } else {
        //             handler(value, path + property);
        //         }
        //
        //         target[property] = value;
        //
        //         return true;
        //     },
        //
        //     get (target, property) {
        //         console.log('get',path+property);
        //         console.log(target);
        //         // console.log(property);
        //         return target[property];
        //
        //         // const value = target[property];
        //         //
        //         // if (value instanceof Object || value instanceof Array) {
        //         //     return self.create(value, handler, path + property + '.');
        //         // } else {
        //         //     return value;
        //         // }
        //
        //     }
        //
        // });

    }

}

// export default {
//
//     create (source, handler, path) {
//         const self = this;
//
//         path = path || '';
//
//         return new Proxy(source, {
//
//             set (target, property, value) {
//                 console.log('set',path+property);
//
//                 if (
//                     (property in target === false) &&
//                     (value instanceof Object || value instanceof Array)
//                 ) {
//                     // console.log(property);
//                     // console.log('create');
//                     value = self.create(value, handler, path + property + '.');
//                 }
//
//                 if (property === 'length') {
//                     handler(target, path.slice(0, -1));
//                 } else {
//                     handler(value, path + property);
//                 }
//
//                 target[property] = value;
//
//                 return true;
//             },
//
//             get (target, property) {
//                 console.log('get',path+property);
//                 console.log(target);
//                 // console.log(property);
//                 return target[property];
//
//                 // const value = target[property];
//                 //
//                 // if (value instanceof Object || value instanceof Array) {
//                 //     return self.create(value, handler, path + property + '.');
//                 // } else {
//                 //     return value;
//                 // }
//
//             }
//
//         });
//
//     }
//
// }

/*
	TODO:
		sort reverse
		test array methods
		figure out a way to not update removed items
*/

// const Observer = {
//
//     splice () {
//         const self = this;
//
//         let startIndex = arguments[0];
//         let deleteCount = arguments[1];
//         let addCount = arguments.length > 2 ? arguments.length - 2 : 0;
//
//         if (typeof startIndex !== 'number' || typeof deleteCount !== 'number') {
//             return [];
//         }
//
//         // handle negative startIndex
//         if (startIndex < 0) {
//             startIndex = self.length + startIndex;
//             startIndex = startIndex > 0 ? startIndex : 0;
//         } else {
//             startIndex = startIndex < self.length ? startIndex : self.length;
//         }
//
//         // handle negative deleteCount
//         if (deleteCount < 0) {
//             deleteCount = 0;
//         } else if (deleteCount > (self.length - startIndex)) {
//             deleteCount = self.length - startIndex;
//         }
//
//         const result = [];
//         let totalCount = self.$meta.length;
//         let argumentIndex = 2;
//         let argumentsCount = arguments.length - argumentIndex;
//         let updateCount = (totalCount - 1) - startIndex;
//
//         const promises = [];
//
//         const length = self.length + addCount - deleteCount;
//
//         if (self.length !== length) {
//             promises.push(self.$meta.listener.bind(null, self, self.$meta.path.slice(0, -1), 'length'));
//         }
//
//         if (updateCount > 0) {
//             let value;
//             let index = startIndex;
//
//             while (updateCount--) {
//                 const key = index++;
//
//                 if (argumentsCount && argumentIndex < argumentsCount) {
//                     value = arguments[argumentIndex++];
//                 } else {
//                     value = self.$meta[index];
//                 }
//
//                 self.$meta[key] = Observer.create(value, self.$meta.listener, self.$meta.path + key);
//                 promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
//             }
//
//         }
//
//
//         if (addCount > 0) {
//             while (addCount--) {
//                 const key = self.length;
//
//                 if (key in this === false) {
//                     Object.defineProperty(this, key, Observer.descriptor(key));
//                 }
//
//                 self.$meta[key] = Observer.create(arguments[argumentIndex++], self.$meta.listener, self.$meta.path + key);
//                 promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
//
//             }
//         }
//
//         if (deleteCount > 0) {
//             while (deleteCount--) {
//                 result.push(self[self.length-1]);
//                 self.$meta.length--;
//                 self.length--;
//                 const key = self.length;
//                 promises.push(self.$meta.listener.bind(null, undefined, self.$meta.path + key, key));
//             }
//         }
//
//         Promise.resolve().then(function () {
//             promises.reduce(function (promise, item) {
//                 return promise.then(item);
//             }, Promise.resolve());
//         }).catch(console.error);
//
//         return result;
//     },
//
//     arrayProperties () {
//         const self = this;
//
//         return {
//             push: {
//                 value: function () {
//                     if (!arguments.length) return this.length;
//
//                     for (let i = 0, l = arguments.length; i < l; i++) {
//                         self.splice.call(this, this.length, 0, arguments[i]);
//                     }
//
//                     return this.length;
//                 }
//             },
//             unshift: {
//                 value: function () {
//                     if (!arguments.length) return this.length;
//
//                     for (let i = 0, l = arguments.length; i < l; i++) {
//                         self.splice.call(this, 0, 0, arguments[i]);
//                     }
//
//                     return this.length;
//                 }
//             },
//             pop: {
//                 value: function () {
//                     if (!this.length) return;
//                     const result = self.splice.call(this, this.length-1, 1);
//                     return result[0];
//                 }
//             },
//             shift: {
//                 value: function () {
//                     if (!this.length) return;
//                     const result = self.splice.call(this, 0, 1);
//                     return result[0];
//                 }
//             },
//             splice: {
//                 value: self.splice
//             }
//         };
//     },
//
//     objectProperties () {
//         const self = this;
//
//         return {
//             $get: {
//                 value: function (key) {
//                     return this.$meta[key];
//                 }
//             },
//             $set: {
//                 value: function (key, value) {
//                     if (value !== this.$meta[key]) {
//
//                         if (key in this === false) {
//                             Object.defineProperty(this, key, self.descriptor(key));
//                         }
//
//                         this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);
//                         this.$meta.listener(this.$meta[key], this.$meta.path + key, key, this);
//                     }
//                 }
//             },
//             $remove: {
//                 value: function (key) {
//                     if (key in this) {
//                         if (this.constructor === Array) {
//                             return self.splice.call(this, key, 1);
//                         } else {
//                             let result = this[key];
//                             delete this.$meta[key];
//                             delete this[key];
//                             this.$meta.listener(undefined, this.$meta.path + key, key);
//                             return result;
//                         }
//                     }
//                 }
//             }
//         };
//     },
//
//     descriptor (key) {
//         const self = this;
//
//         return {
//             enumerable: true,
//             configurable: true,
//             get: function () {
//                 return this.$meta[key];
//             },
//             set: function (value) {
//                 if (value !== this.$meta[key]) {
//                     this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);
//                     this.$meta.listener(this.$meta[key], this.$meta.path + key, key, this);
//                 }
//             }
//         };
//     },
//
//     create (source, listener, path) {
//         // const self = this;
//
//         if (!source || source.constructor !== Object && source.constructor !== Array) {
//             return source;
//         }
//
//         path = path ? path + '.' : '';
//
//         const type = source.constructor;
//         const target = source.constructor();
//         const descriptors = {};
//
//         descriptors.$meta = {
//             value: source.constructor()
//         };
//
//         descriptors.$meta.value.path = path;
//         descriptors.$meta.value.listener = listener;
//
//         if (type === Array) {
//             for (let key = 0, length = source.length; key < length; key++) {
//                 descriptors.$meta.value[key] = this.create(source[key], listener, path + key);
//                 descriptors[key] = this.descriptor(key);
//             }
//         }
//
//         if (type === Object) {
//             for (let key in source) {
//                 descriptors.$meta.value[key] = this.create(source[key], listener, path + key);
//                 descriptors[key] = this.descriptor(key);
//             }
//         }
//
//         Object.defineProperties(target, descriptors);
//         Object.defineProperties(target, this.objectProperties(source, listener, path));
//
//         if (type === Array) {
//             Object.defineProperties(target, this.arrayProperties(source, listener, path));
//         }
//
//         return target;
//     }
//
// };
//
// export default Observer;
