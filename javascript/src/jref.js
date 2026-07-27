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
        throw new Error(`Jref pointer="${pointer}" could not be resolved`, { cause: error });
      }
    }
    parent[key] = target;
  }

  return parsed;
};

/** @type JSON["stringify"] */
export const stringify = (value, replacer, space) => {
  let map = new WeakMap();
  let jrefReplacer = replacer;
  if (replacer === undefined || replacer === null || typeof replacer == "function") {
    jrefReplacer = function (key, val) {
      const resultValue = replacer != null ? replacer(key, val) : val;
      const isObj = resultValue !== null
        && (typeof resultValue === "object" || typeof resultValue === "function");
      const valueName = isObj ? map.get(resultValue) : undefined;
      const jref = valueName !== undefined ? valueName.getPointer() : undefined;

      return jref !== undefined
        ? { [JREF_PROPERTY_NAME]: "#" + encodeURI(jref).replace(/#/g, "%23") }
        : (isObj && map.set(resultValue, new Name(key, map.get(this))), resultValue);
    };
  }
  // @ts-expect-error
  return JSON.stringify(value, jrefReplacer, space);
};

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
