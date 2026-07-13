import * as JsonPointer from "@hyperjump/json-pointer";

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
			// remove first character '#' local-only and decode URI syntax
			const pointer = decodeURI(current[JREF_PROPERTY_NAME].slice(1));
			// lookup/resolve ptr on root to get reference result
			try {
            	return JsonPointer.get(pointer, root);
			} catch (err) {
				throw new Error(`Jref pointer="${pointer}" could not be resolved because`, { cause: err })
			}
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

		getPointer() {
			if (this.parent == null) return JsonPointer.nil;
			return JsonPointer.append(this.name, this.parent.getPointer());
		}
    }
    let map = new WeakMap();
    return JSON.stringify(value, function(key, val) {
        const resultValue = replacer != null ? replacer(key, val) : val;
        const isObj = resultValue !== null &&
            (typeof resultValue === 'object' || typeof resultValue === 'function');
        const valueName = isObj ? map.get(resultValue) : undefined;
        const jref = valueName !== undefined ? valueName.getPointer() : undefined;

        return jref !== undefined
            ? (jref, { [JREF_PROPERTY_NAME]: '#' + jref })
            : (isObj && map.set(resultValue, new Name(key, map.get(this))), resultValue);
    }, space);
}

