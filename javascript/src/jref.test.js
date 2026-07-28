import { describe, test, expect } from "vitest";
import * as JRef from "./jref.js";

expect.extend({
  toHaveJRefCount(json, expected) {
    const matches = json.match(/"\$ref"/g);
    const actual = matches ? matches.length : 0;
    return {
      pass: actual === expected,
      message: () => `Expected ${expected} JRef(s), but found ${actual}`
    };
  }
});

describe("JRef", () => {
  test("basic functionality", () => {
    const props = { p: 1 };
    const inputValue = {
      items: [
        { name: "sam", parent: null, props: props },
        { name: "wendy", parent: null, moreProps: props }
      ]
    };

    const txt = JRef.stringify(inputValue);
    expect(txt).toHaveJRefCount(1);

    const result = JRef.parse(txt);
    expect(result.items[0].props).toBe(result.items[1].moreProps);
    expect(result.items[1].moreProps.p).toBe(1);
  });

  test("object array ref", () => {
    const o1 = { id: 1 };
    const o2 = o1;
    const arr = [o1, o2];

    const out = JRef.stringify(arr);
    expect(out).toHaveJRefCount(1);

    const oa = JRef.parse(out);
    expect(typeof oa[0]).toBe("object");
    expect(typeof oa[1]).toBe("object");
    expect(oa[0]).toBe(oa[1]);
  });

  test("string array ref", () => {
    const o1 = new String("one");
    const o2 = o1;
    const arr = [o1, o2];

    const out = JRef.stringify(arr);
    expect(out).toHaveJRefCount(1);

    const oa = JRef.parse(out);
    expect(oa[0].valueOf()).toBe("one");
    expect(oa[0]).toBe(oa[1]);
  });

  test("2D object array ref", () => {
    const o1 = { id: "obj" };
    const o2 = o1;
    const arr1 = [o1, o2];
    const arr2 = arr1;

    const input = [arr1, arr2];
    const out = JRef.stringify(input);
    expect(out).toHaveJRefCount(2);

    const oa = JRef.parse(out);
    expect(oa[0]).toBe(oa[1]);
    expect(oa[0][0]).toBe(oa[0][1]);
  });

  test("map value ref", () => {
    const v1 = { val: "val1" };
    const mi = {
      first: v1,
      second: v1
    };

    const out = JRef.stringify(mi);
    expect(out).toHaveJRefCount(1);

    const mo = JRef.parse(out);
    expect(mo.first).toBe(mo.second);
  });

  test("map value multiple refs", () => {
    const v1 = { val: "val1" };
    const mi = {
      first: v1,
      second: v1,
      third: v1,
      fourth: v1
    };

    const out = JRef.stringify(mi);
    expect(out).toHaveJRefCount(3);

    const mo = JRef.parse(out);
    expect(mo.first).toBe(mo.second);
    expect(mo.first).toBe(mo.third);
    expect(mo.first).toBe(mo.fourth);
  });

  test("circular reference", () => {
    /** @type any */
    const a = { name: "A" };
    /** @type any */
    const b = { name: "B" };
    a.friend = b;
    b.friend = a;

    const out = JRef.stringify(a);
    expect(out).toHaveJRefCount(1);

    const result = JRef.parse(out);
    expect(result.friend.friend).toBe(result);
    expect(result.name).toBe("A");
    expect(result.friend.name).toBe("B");
  });

  test("deeply nested tree", () => {
    const top = { name: "top", data: "root-data" };
    const child1 = { name: "child1", parent: top };
    const child2 = { name: "child2", parent: top };
    const grandchild = { name: "gc1", parent: child1, root: top };

    const input = [top, child1, child2, grandchild];
    const json = JRef.stringify(input);
    expect(json).toHaveJRefCount(4);

    const output = JRef.parse(json);
    expect(output[1].parent).toBe(output[0]);
    expect(output[2].parent).toBe(output[0]);
    expect(output[3].parent).toBe(output[1]);
    expect(output[3].root).toBe(output[0]);
  });

  test("escaped characters in keys", () => {
    const target1 = { id: "target1" };
    const target2 = { id: "target2" };
    const input = {
      "key/with/slashes": target1,
      "key~with~tildes": target2,
      "refs": [target1, target2]
    };

    const json = JRef.stringify(input);
    expect(json).toContain("~1");
    expect(json).toContain("~0");

    const output = JRef.parse(json);
    expect(output["key/with/slashes"]).toBe(output.refs[0]);
    expect(output["key~with~tildes"]).toBe(output.refs[1]);
  });

  test("multiple refs to same object", () => {
    const shared = { info: "shared" };
    const input = {
      a: shared,
      b: { nested: shared },
      c: [shared],
      d: shared
    };

    const json = JRef.stringify(input);
    expect(json).toHaveJRefCount(3);

    const output = JRef.parse(json);
    expect(output.a).toBe(output.b.nested);
    expect(output.a).toBe(output.c[0]);
    expect(output.a).toBe(output.d);
  });

  test("array of same objects", () => {
    const obj = { val: 42 };
    const input = [obj, obj, obj, { wrap: obj }];

    const json = JRef.stringify(input);
    expect(json).toHaveJRefCount(3);

    const output = JRef.parse(json);
    expect(output[0]).toBe(output[1]);
    expect(output[0]).toBe(output[2]);
    expect(output[0]).toBe(output[3].wrap);
  });

  test("null and undefined values", () => {
    const obj = { name: "test" };
    const input = {
      first: obj,
      second: null,
      third: undefined,
      fourth: obj
    };

    const json = JRef.stringify(input);
    expect(json).toHaveJRefCount(1);

    const output = JRef.parse(json);
    expect(output.second).toBeNull();
    expect("third" in output).toBe(false);
    expect(output.first).toBe(output.fourth);
  });

  test("mixed array types", () => {
    const meta = { type: "metadata" };
    const input = [1, "string", meta, true, meta, { ref: meta }];

    const json = JRef.stringify(input);
    expect(json).toHaveJRefCount(2);

    const output = JRef.parse(json);
    expect(output[0]).toBe(1);
    expect(output[1]).toBe("string");
    expect(output[2]).toBe(output[4]);
    expect(output[2]).toBe(output[5].ref);
  });

  test("root as array", () => {
    const item = { id: "item" };
    const input = [item, { link: item }];

    const json = JRef.stringify(input);
    expect(json.startsWith("[")).toBe(true);

    const output = JRef.parse(json);
    expect(Array.isArray(output)).toBe(true);
    expect(output[0]).toBe(output[1].link);
  });

  test("complex circular reference", () => {
    /** @type any */
    const nodeA = { name: "A" };
    /** @type any */
    const nodeB = { name: "B" };
    /** @type any */
    const nodeC = { name: "C" };

    nodeA.next = nodeB;
    nodeB.next = nodeC;
    nodeC.next = nodeA;

    const input = { start: nodeA, list: [nodeA, nodeB, nodeC] };
    const json = JRef.stringify(input);

    const output = JRef.parse(json);
    const a = output.start;
    const b = a.next;
    const c = b.next;

    expect(c.next).toBe(a);
    expect(output.list[0]).toBe(a);
    expect(output.list[1]).toBe(b);
    expect(output.list[2]).toBe(c);
  });

  test("invalid pointer resolution throws", () => {
    const json = "{\"a\": {\"$ref\": \"#/non/existent\"}}";
    expect(() => JRef.parse(json)).toThrow("could not be resolved");
  });

  test("ref to non-existent property on existing object throws", () => {
    const json = `{
      "a": { "x": 1 },
      "b": { "$ref": "#/a/y" }
    }`;
    expect(() => JRef.parse(json)).toThrow("could not be resolved");
  });

  test("ref to out-of-bounds array index throws", () => {
    const json = `{
      "a": [1, 2, 3],
      "b": { "$ref": "#/a/5" }
    }`;
    expect(() => JRef.parse(json)).toThrow("could not be resolved");
  });

  test("ref to non-existent nested property throws", () => {
    const json = `{
      "a": { "b": { "c": 1 } },
      "d": { "$ref": "#/a/b/x" }
    }`;
    expect(() => JRef.parse(json)).toThrow("could not be resolved");
  });

  test("deeply nested tree with replacer function", () => {
    const top = { name: "top", data: "root-data" };
    const child1 = { name: "child1", parent: top };
    const child2 = { name: "child2", parent: top };
    const grandchild = { name: "gc1", parent: child1, root: top };

    const input = [top, child1, child2, grandchild];
    const json = JRef.stringify(input, (_key, v) => v);
    expect(json).toHaveJRefCount(4);

    const output = JRef.parse(json, (_key, v) => v);
    expect(output[1].parent).toBe(output[0]);
    expect(output[2].parent).toBe(output[0]);
    expect(output[3].parent).toBe(output[1]);
    expect(output[3].root).toBe(output[0]);
  });

  test("parse decodes %23 in pointer paths", () => {
    const json = `{
      "data": { "a#b": 42 },
      "ref": { "$ref": "#/data/a%23b" }
    }`;
    const output = JRef.parse(json);
    expect(output.ref).toBe(42);
  });

  test("stringify encodes # in pointer paths", () => {
    const target = { value: 1 };
    const input = {
      "a#b": target,
      "a": target
    };

    const json = JRef.stringify(input);
    expect(json).toContain(`"$ref":"#/a%23b`);

    const output = JRef.parse(json);
    expect(output.a).toBe(output["a#b"]);
  });

  test("round-trip with # in keys via properly-encoded input", () => {
    const json = `{
      "items": { "a#b": { "x": 1 } },
      "link": { "$ref": "#/items/a%23b" }
    }`;
    const output = JRef.parse(json);
    expect(output.link).toEqual({ x: 1 });
    expect(output.link).toBe(output.items["a#b"]);
  });

  test("ref without hash prefix throws", () => {
    const json = `{
      "a": { "value": 42 },
      "b": { "$ref": "x/a" }
    }`;
    expect(() => JRef.parse(json)).toThrow("Only local references are supported");
  });

  test("reference chain", () => {
    const json = `{
      "a": { "$ref": "#/b" },
      "b": { "$ref": "#/c" },
      "c": { "value": 42 }
    }`;
    const output = JRef.parse(json);
    expect(output.a).toEqual({ value: 42 });
    expect(output.b).toEqual({ value: 42 });
    expect(output.a).toBe(output.b);
  });

  test("self reference in parse", () => {
    const json = `{
      "a": { "$ref": "#/a" }
    }`;
    expect(() => JRef.parse(json)).toThrow("Circular reference detected");
  });

  test("reference cycle in parse", () => {
    const json = `{
      "a": { "$ref": "#/b" },
      "b": { "$ref": "#/c" },
      "c": { "$ref": "#/a" }
    }`;
    expect(() => JRef.parse(json)).toThrow("Circular reference detected");
  });

  test("replacer that wraps objects preserves reference tracking", () => {
    const shared = { x: 1 };
    const input = { a: shared, b: shared };

    const json = JRef.stringify(input, (_key, val) => {
      if (val?.x !== undefined) {
        return { ...val, wrapped: true };
      }
      return val;
    });

    expect(json).toHaveJRefCount(1);

    const output = JRef.parse(json);
    expect(output.a).toBe(output.b);
    expect(output.a).toEqual({ x: 1, wrapped: true });
  });

  test("replacer should not run multiple times for referenced values", () => {
    const shared = { x: 1 };
    const input = { a: shared, b: shared };

    let callCount = 0;
    const json = JRef.stringify(input, (_key, value) => {
      if (value?.x !== undefined) {
        return { x: value.x, id: ++callCount };
      }
      return value;
    });

    expect(json).toHaveJRefCount(1);

    const output = JRef.parse(json);
    expect(output.a).toEqual({ x: 1, id: 1 });
    expect(output.b).toEqual({ x: 1, id: 1 });
    expect(output.a).toBe(output.b);
    expect(callCount).toBe(1);
  });

  test("replacer that wraps numbers", () => {
    const input = { a: 42, b: "hello" };

    const json = JRef.stringify(input, (_key, val) => {
      if (typeof val === "number") {
        return { type: "number", value: String(val) };
      }
      return val;
    });

    expect(json).toHaveJRefCount(0);

    const output = JRef.parse(json);
    expect(output.a).toEqual({ type: "number", value: "42" });
    expect(output.b).toBe("hello");
    expect(output.a).not.toBe(output.b);
  });

  test("array replacer filters to only listed properties", () => {
    const input = { a: 1, b: 2, c: 3 };

    const json = JRef.stringify(input, ["a", "c"]);
    const output = JRef.parse(json);

    expect(output).toEqual({ a: 1, c: 3 });
  });

  test("array replacer filters nested objects", () => {
    const input = { a: { x: 1, y: 2, z: 3 }, b: "keep" };

    const json = JRef.stringify(input, ["a", "x"]);
    const output = JRef.parse(json);

    expect(output).toEqual({ a: { x: 1 } });
  });

  test("array replacer lets arrays pass through unfiltered", () => {
    const input = { items: [1, 2, 3] };

    const json = JRef.stringify(input, ["items"]);
    const output = JRef.parse(json);

    expect(output.items).toEqual([1, 2, 3]);
  });

  test("array replacers and numeric property names", () => {
    const input = { 0: "zero", 1: "one", 2: "two" };

    const json = JRef.stringify(input, [0, 2]);
    const output = JRef.parse(json);

    expect(output).toEqual({ 0: "zero", 2: "two" });
    expect(output).not.toHaveProperty("1");
  });

  test("array replacer preserves reference tracking", () => {
    const shared = { name: "target", extra: "data" };
    const input = { a: shared, b: shared };

    const json = JRef.stringify(input, ["a", "b", "name"]);
    expect(json).toHaveJRefCount(1);

    const output = JRef.parse(json);
    expect(output.a).toEqual({ name: "target" });
    expect(output.b).toEqual({ name: "target" });
    expect(output.a).toBe(output.b);
  });

  test("replacer returning the same object for different inputs should produce refs", () => {
    const replacement = { z: 99 };
    const input = { a: { x: 1 }, b: { y: 2 } };

    const json = JRef.stringify(input, (_key, val) => {
      if (val?.x) {
        return replacement;
      }

      if (val?.y) {
        return replacement;
      }

      return val;
    });

    expect(json).toHaveJRefCount(1);

    const output = JRef.parse(json);
    expect(output.a).toEqual({ z: 99 });
    expect(output.b).toEqual({ z: 99 });
    expect(output.a).toBe(output.b);
  });

  test("pointer should fail when traversing inside a reference object", () => {
    const json = `{
      "a": { "$ref": "#/b/$ref" },
      "b": { "$ref": "#/c" },
      "c": 42
    }`;
    expect(() => JRef.parse(json)).toThrow("could not be resolved");
  });

  test("extra properties on ref objects should not be resolved", () => {
    const json = `{
      "a": { "$ref": "#/b" },
      "b": { "$ref": "#/c", "x": { "y": { "$ref": "#/nonexistent" } } },
      "c": 42
    }`;
    const result = JRef.parse(json);
    expect(result.a).toBe(42);
  });

  test("don't run reviver on references", () => {
    const json = `{
      "a": { "x": 1 },
      "b": { "$ref": "#/a" }
    }`;

    let hasRefKey = false;
    JRef.parse(json, (key, value) => {
      if (key === "$ref") {
        hasRefKey = true;
      }
      return value;
    });

    expect(hasRefKey).toBe(false);
  });
});
