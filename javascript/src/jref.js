import * as JsonPointer from "@hyperjump/json-pointer";

export const JREF_PROPERTY_NAME = "$ref";

/** @type JSON["parse"] */
export const parse = (text, reviver) => {
  /** @type Map<{ $ref: string }, { key: string, parent: Record<string, any>}> */
  const references = new Map();

  const parsed = JSON.parse(text, function (key, value) {
    if (this?.[JREF_PROPERTY_NAME] !== undefined) {
      for (const key in this) {
        if (key !== JREF_PROPERTY_NAME) {
          delete this[key];
        }
      }

      return value;
    }

    if (value?.[JREF_PROPERTY_NAME] !== undefined) {
      if (typeof value[JREF_PROPERTY_NAME] !== "string") {
        throw new Error(`Reference value must be a string. Found ${typeof value[JREF_PROPERTY_NAME]}`);
      }
      if (!value[JREF_PROPERTY_NAME].startsWith("#")) {
        throw Error(`Only local references are supported. Found reference, ${value[JREF_PROPERTY_NAME]}`);
      }

      references.set(value, { key, parent: this });
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
        if (target === undefined || pointer.includes(JREF_PROPERTY_NAME)) {
          throw new Error("No such location");
        }
      } catch (error) {
        throw new Error(`JSON Pointer="${pointer}" could not be resolved`, { cause: error });
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

  /** @type WeakMap<object, string> */
  const values = new WeakMap();

  return JSON.stringify(value, function (key, value) {
    const pointer = values.get(value);
    if (pointer !== undefined) {
      return { [JREF_PROPERTY_NAME]: encodeRef(pointer) };
    }

    let replacedValue = replacer ? replacer(key, value) : value;

    const replacedPointer = values.get(replacedValue);
    if (replacedPointer !== undefined) {
      return { [JREF_PROPERTY_NAME]: encodeRef(replacedPointer) };
    }

    if (typeof replacedValue === "object" && replacedValue !== null) {
      const parentPointer = values.get(this);
      const pointer = parentPointer === undefined ? JsonPointer.nil : JsonPointer.append(key, parentPointer);
      values.set(replacedValue, pointer);
      if (typeof value === "object" && value !== null && value !== replacedValue) {
        values.set(value, pointer);
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

/**
 * @param {string} pointer
 */
const encodeRef = (pointer) => "#" + encodeURI(pointer).replace(/#/g, "%23");

/**
 * @param {any} value
 * @returns {value is Record<string, any>}
 */
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
