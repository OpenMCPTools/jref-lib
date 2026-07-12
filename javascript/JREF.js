import { compile } from 'jsonpointer';

export const JREF_PROPERTY_NAME = '$ref';

export function parse(text, reviver, space) {
    function resolvePtrs(root, current) {
        // on first call, set current to root
        if (current === undefined) {
            current = root;
        }
        // If current is null or primitive (not object) just return it
        if (current === null || typeof current != 'object') return current;
		
        // resolvePtrs of all key->value props in object (arrays included)
        for (const [key, value] of Object.entries(current)) {
            current[key] = resolvePtrs(root, value);
        }
        // if '$ref' property in current object
        if (JREF_PROPERTY_NAME in current) {
            // compile value - after '#' first character rmoved
            const ptr = compile(current[JREF_PROPERTY_NAME].slice(1));
			// lookup/resolve ptr on root to get reference result
            const result = ptr.get(root);
			// reference result must not be 
            if (!result) {
                throw new Error(`Jref ptr="${ptr}" could not be resolved`);
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
			if (this.parent == null) return "";
			const escaped = String(this.name).replace(/~/g, '~0').replace(/\//g, '~1');
			return this.parent.getFullName().concat("/").concat(escaped);
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

