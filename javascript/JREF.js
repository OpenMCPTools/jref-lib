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
		for(const [key, value] of Object.entries(current)) {
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
	// setup map for object -> Name map
	let map = new Map();
	return JSON.stringify(value, function(key, val) {
		let resultValue = val;
		if (replacer != null) {
			resultValue = replacer(key, val);
		}
		// skip null values and primitive values)
		if (resultValue != null && resultValue === Object(resultValue)) {
			let valueName = map.get(resultValue);
			if (valueName != null) {
				const jrefValue = valueName.getFullName();
				// Check that the syntax is right with jsonpointer.compile
				compile(jrefValue);
				return { [JREF_PROPERTY_NAME] : "#".concat(jrefValue) };
			} else {
				const parentName = map.get(this);
				map.set(resultValue, new Name(key, parentName));
			}
		}
		return resultValue;
	}, space);
}

