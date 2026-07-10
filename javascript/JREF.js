import { compile } from 'jsonpointer';

export const JREF_PROPERTY_NAME = '$ref';

export function parse(text, reviver, space) {
    function resolvePtrs(root, current) {
        // set to root first time
        if (current === undefined) {
            current = root;
        }
        // If null or not object just return it
        if (current === null || typeof current != 'object') return current;
        // If array then return resolvePtrs for each item
        if (Array.isArray(current)) {
            return current.map(item => resolvePtrs(root, item));
        }
        // For objects, first resolvePtrs
        for (const [key, value] of Object.entries(current)) {
            current[key] = resolvePtrs(root, value);
        }
        // if '$ref' property in current object
        if (JREF_PROPERTY_NAME in current) {
            // compile value - '#' first character, and lookup ptr on root
            let ptr = compile(current[JREF_PROPERTY_NAME].slice(1));
            let result = ptr.get(root);
            if (result === null || result === undefined) {
                throw new Error('Jref ptr="${ptr}" could not be resolved');
            }
            return result;
        }
        return current;
    }
    // call JSON parse and then resolvePtrs
    return resolvePtrs(JSON.parse(text, reviver, space));
}

export function stringify(value, replacer, space) {
    // Name class to hold onto name/parent Name
    // for objects and arrays
    class Name {
        constructor(_name, _parent) {
            this.name = _name;
            this.parent = _parent;
        }

        getFullName() {
            if (this.parent == null) {
                return ""
            } else {
                return this.parent.getFullName().concat("/").concat(this.name);
            }
        }
    }
    let map = new WeakMap();
    return JSON.stringify(value, function(key, val) {
        const resultValue = replacer != null ? replacer(key, val) : val;
        const isObj = resultValue !== null &&
            (typeof resultValue === 'object' || typeof resultValue === 'function');
        const valueName = isObj ? map.get(resultValue) : undefined;
        const jref = valueName !== undefined ? valueName.getFullName() : undefined;

        return jref !== undefined
            ? (compile(jref), { [JREF_PROPERTY_NAME]: '#' + jref })
            : (isObj && map.set(resultValue, new Name(key, map.get(this))), resultValue);
    }, space);
}

