import * as JsonPointer from "@hyperjump/json-pointer";

export const JREF_PROPERTY_NAME = "$ref";

/** @type JSON["parse"] */
export const parse = (text, reviver) => {
  /** @type Map<{ $ref: string }, { key: string, parent: Record<string, any>}> */
  const references = new Map();

  const parsed = JSON.parse(text, function (key, value) {
    if (value?.[JREF_PROPERTY_NAME] !== undefined) {
      if (!value[JREF_PROPERTY_NAME].startsWith("#")) {
        throw Error(`Only local references are supported. Found reference, ${value[JREF_PROPERTY_NAME]}`);
      }

      references.set(value, { key, parent: this });
    }

    if (this?.[JREF_PROPERTY_NAME] !== undefined) {
      // Don't run the reviver on references
      return value;
    }

    return reviver ? reviver(key, value) : value;
  });

  // Resolve references
  for (const [value, { key, parent }] of references) {
    /** @type any */
    let target = value;
    const visited = new Set();
    while (target?.[JREF_PROPERTY_NAME] !== undefined) {
      if (visited.has(target)) {
        throw new Error(`Circular reference detected`);
      }
      visited.add(target);

      // remove first character '#' local-only and decode URI syntax
      const pointer = decodeURIComponent(target[JREF_PROPERTY_NAME].slice(1));

      // lookup/resolve ptr on root to get reference result
      try {
        target = JsonPointer.get(pointer, parsed);
      } catch (error) {
        throw new Error(`JSON Pointer="${pointer}" could not be resolved`, { cause: error });
      }

      if (target === undefined) {
        throw new Error(`JSON Pointer="${pointer}" could not be resolved`);
      }
    }
    parent[key] = target;
  }

  return parsed;
};

/** @type JSON["stringify"] */
export const stringify = (value, replacer, space) => {
  if (Array.isArray(replacer)) {
    replacer = arrayReplacer(replacer);
  }

  /** @type WeakMap<object, any> */
  const values = new WeakMap();

  return JSON.stringify(value, function (key, value) {
    const pointer = values.get(value)?.getPointer();
    if (pointer !== undefined) {
      return { [JREF_PROPERTY_NAME]: "#" + encodeURI(pointer).replace(/#/g, "%23") };
    }

    let replacedValue = replacer ? replacer(key, value) : value;
    if (typeof replacedValue === "object" && replacedValue !== null) {
      const name = new Name(key, values.get(this));
      if (typeof value === "object" && value !== null) {
        values.set(value, name);
      }
      if (replacedValue !== value) {
        values.set(replacedValue, name);
      }
    }

    return replacedValue;
  }, space);
};

/**
 * @param {(string | number)[]} replacer
 */
const arrayReplacer = (replacer) => {
  /** @type Set<string> */
  let propertyList = new Set();

  for (const property of replacer) {
    const type = typeof property;
    if (type === "string" || type === "number") {
      propertyList.add(String(property));
    }
  }

  /**
   * @param {string} _key
   * @param {any} value
   */
  return (_key, value) => {
    if (!isObject(value)) {
      return value;
    }

    /** @type Record<string, any> */
    const result = {};
    for (const property in value) {
      if (propertyList.has(property)) {
        result[property] = value[property];
      }
    }

    return result;
  };
};

/** @type (value: any) => value is Record<string, any> */
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

// Name class to hold onto name/parent Name
// for objects and arrays
class Name {
  /**
  * @param {string} name
  * @param {Name} parent
  */
  constructor(name, parent) {
    this.name = name;
    this.parent = parent;
  }

  /** @type () => string */
  getPointer() {
    if (this.parent == null) {
      return JsonPointer.nil;
    }
    return JsonPointer.append(this.name, this.parent.getPointer());
  }
}
