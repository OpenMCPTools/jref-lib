import { parse, stringify } from './JREF.js';

/**
 * Test code for JREF.stringify and JREF.parse functions.
 */

function assert(condition, message) {
    if (!condition) {
        throw new Error("Assertion failed: " + message);
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`Assertion failed: ${message}. Expected ${expected}, but got ${actual}`);
    }
}

function assertJRefCount(json, expectedCount) {
    const matches = json.match(/"\$ref"/g);
    const actualCount = matches ? matches.length : 0;
    if (actualCount !== expectedCount) {
        throw new Error(`Expected ${expectedCount} JRef(s), but found ${actualCount} in: ${json}`);
    }
}

/**
 * Original provided example test
 */
function testBasicFunctionality() {
    console.log("Running: testBasicFunctionality");
    let props = { "p": 1 };
    let inputValue = {
        "items": [
            { "name": "sam", "parent": null, "props": props },
            { "name": "wendy", "parent": null, "moreProps": props }
        ]
    };

    let txt = stringify(inputValue);
    console.log("stringify json=" + txt);
    assertJRefCount(txt, 1);

    let result = parse(txt);
    console.log("parse json=" + JSON.stringify(result));

    assert(result.items[0].props === result.items[1].moreProps, "Properties should be the same instance");
    assertEquals(result.items[1].moreProps.p, 1, "Property value should be 1");
}

/**
 * Ported from JRefArrayTest.java: testObjectArrayRef
 */
function testObjectArrayRef() {
    console.log("Running: testObjectArrayRef");
    let o1 = { id: 1 };
    let o2 = o1;
    let arr = [o1, o2];

    let out = stringify(arr);
    console.log("testObjectArrayRef json=" + out);
    assertJRefCount(out, 1);

    let oa = parse(out);
    assert(typeof oa[0] === 'object', "First element should be an object");
    assert(typeof oa[1] === 'object', "Second element should be an object");
    assert(oa[0] === oa[1], "Elements should be the same instance");
}

/**
 * Ported from JRefArrayTest.java: testStringArrayRef
 * Note: In JS, primitive strings are not objects and won't be JRef'd by WeakMap.
 * We use String objects to simulate the Java behavior if needed, 
 * but usually JS JREF targets objects.
 */
function testStringArrayRef() {
    console.log("Running: testStringArrayRef");
    // Using String objects to ensure they are treated as referenceable objects
    let o1 = new String("one");
    let o2 = o1;
    let arr = [o1, o2];

    let out = stringify(arr);
    console.log("testStringArrayRef json=" + out);
    // In JS JREF implementation, String objects are handled by WeakMap
    assertJRefCount(out, 1);

    let oa = parse(out);
    assert(oa[0].valueOf() === "one", "Value should be 'one'");
    assert(oa[0] === oa[1], "String objects should be the same instance");
}

/**
 * Ported from JRefArrayTest.java: test2DObjectArrayRef
 */
function test2DObjectArrayRef() {
    console.log("Running: test2DObjectArrayRef");
    let o1 = { id: "obj" };
    let o2 = o1;
    let arr1 = [o1, o2];
    let arr2 = arr1;

    let input = [arr1, arr2];
    let out = stringify(input);
    console.log("test2DObjectArrayRef json=" + out);
    // 1 for the second o1 reference, 1 for the second arr1 reference
    assertJRefCount(out, 2);

    let oa = parse(out);
    assert(oa[0] === oa[1], "Outer array elements should be the same instance");
    assert(oa[0][0] === oa[0][1], "Inner array elements should be the same instance");
}

/**
 * Ported from JRefMapTest.java: testMapValueRef
 */
function testMapValueRef() {
    console.log("Running: testMapValueRef");
    let v1 = { val: "val1" };
    let mi = {
        "first": v1,
        "second": v1
    };

    let out = stringify(mi);
    console.log("testMapValueRef json=" + out);
    assertJRefCount(out, 1);

    let mo = parse(out);
    assert(mo.first === mo.second, "Map values should be the same instance");
}

/**
 * Ported from JRefMapTest.java: testMapValueMultRef
 */
function testMapValueMultRef() {
    console.log("Running: testMapValueMultRef");
    let v1 = { val: "val1" };
    let mi = {
        "first": v1,
        "second": v1,
        "third": v1,
        "fourth": v1
    };

    let out = stringify(mi);
    console.log("testMapValueMultRef json=" + out);
    assertJRefCount(out, 3);

    let mo = parse(out);
    assert(mo.first === mo.second, "First and second should match");
    assert(mo.first === mo.third, "First and third should match");
    assert(mo.first === mo.fourth, "First and fourth should match");
}

/**
 * Test circular reference handling
 */
function testCircularReference() {
    console.log("Running: testCircularReference");
    let a = { name: "A" };
    let b = { name: "B" };
    a.friend = b;
    b.friend = a;

    let out = stringify(a);
    console.log("testCircularReference json=" + out);
    assertJRefCount(out, 1);

    let result = parse(out);
    assert(result.friend.friend === result, "Circular reference should be restored");
    assertEquals(result.name, "A", "Root name should be A");
    assertEquals(result.friend.name, "B", "Friend name should be B");
}

/**
 * Tests deeply nested tree structures with multiple levels of references.
 */
function testDeeplyNestedTree() {
    console.log("Running: testDeeplyNestedTree");
    const top = { name: "top", data: "root-data" };
    const child1 = { name: "child1", parent: top };
    const child2 = { name: "child2", parent: top };
    const grandchild = { name: "gc1", parent: child1, root: top };

    const input = [top, child1, child2, grandchild];
    const json = stringify(input);
    console.log("testDeeplyNestedTree json=" + json);

    // child1.parent -> top (#/0)
    // child2.parent -> top (#/0)
    // grandchild.parent -> child1 (#/1)
    // grandchild.root -> top (#/0)
    assertJRefCount(json, 4);

    const output = parse(json);
    assert(output[1].parent === output[0], "Child1 parent should be Top");
    assert(output[2].parent === output[0], "Child2 parent should be Top");
    assert(output[3].parent === output[1], "Grandchild parent should be Child1");
    assert(output[3].root === output[0], "Grandchild root should be Top");
}

/**
 * Tests JSON Pointers with escaped characters (~ and /).
 */
function testEscapedCharactersInKeys() {
    console.log("Running: testEscapedCharactersInKeys");
    const target1 = { id: "target1" };
    const target2 = { id: "target2" };
    const input = {
        "key/with/slashes": target1,
        "key~with~tildes": target2,
        "refs": [target1, target2]
    };

    const json = stringify(input);
    console.log("testEscapedCharactersInKeys json=" + json);

    // Should contain escaped pointers like #/key~1with~1slashes
    assert(json.includes("~1"), "Should contain escaped slash (~1)");
    assert(json.includes("~0"), "Should contain escaped tilde (~0)");

    const output = parse(json);
    assert(output["key/with/slashes"] === output.refs[0], "Slash key reference failed");
    assert(output["key~with~tildes"] === output.refs[1], "Tilde key reference failed");
}

/**
 * Tests multiple references to the same object within a Map-like structure.
 */
function testMultipleRefsToSameObject() {
    console.log("Running: testMultipleRefsToSameObject");
    const shared = { info: "shared" };
    const input = {
        a: shared,
        b: { nested: shared },
        c: [shared],
        d: shared
    };

    const json = stringify(input);
    assertJRefCount(json, 3);
    console.log("testMultipleRefsToSameObject json=" + json);
    const output = parse(json);
    assert(output.a === output.b.nested, "Ref B failed");
    assert(output.a === output.c[0], "Ref C failed");
    assert(output.a === output.d, "Ref D failed");
}

/**
 * Tests an array containing multiple instances of the same object.
 */
function testArrayOfSameObjects() {
    console.log("Running: testArrayOfSameObjects");
    const obj = { val: 42 };
    const input = [obj, obj, obj, { wrap: obj }];

    const json = stringify(input);
    assertJRefCount(json, 3);
    console.log("testArrayOfSameObjects json=" + json);

    const output = parse(json);
    assert(output[0] === output[1], "Index 1 should ref Index 0");
    assert(output[0] === output[2], "Index 2 should ref Index 0");
    assert(output[0] === output[3].wrap, "Nested wrap should ref Index 0");
}

/**
 * Tests that null and undefined values are handled correctly and not treated as objects.
 */
function testNullAndUndefinedValues() {
    console.log("Running: testNullAndUndefinedValues");
    const obj = { name: "test" };
    const input = {
        first: obj,
        second: null,
        third: undefined, // JSON.stringify usually omits undefined
        fourth: obj
    };

    const json = stringify(input);
    assertJRefCount(json, 1);
    console.log("testNullAndUndefinedValues json=" + json);

    const output = parse(json);
    assertEquals(output.second, null, "Null should remain null");
    assert(!("third" in output), "Undefined should be omitted by standard JSON rules");
    assert(output.first === output.fourth, "Reference after null/undefined should work");
}

/**
 * Tests arrays with mixed types (objects and primitives).
 */
function testMixedArrayTypes() {
    console.log("Running: testMixedArrayTypes");
    const meta = { type: "metadata" };
    const input = [1, "string", meta, true, meta, { ref: meta }];

    const json = stringify(input);
    assertJRefCount(json, 2);
    console.log("testMixedArrayTypes json=" + json);

    const output = parse(json);
    assertEquals(output[0], 1, "Number preserved");
    assertEquals(output[1], "string", "String preserved");
    assert(output[2] === output[4], "Object ref preserved");
    assert(output[2] === output[5].ref, "Nested object ref preserved");
}

/**
 * Tests when the root of the JREF structure is an array.
 */
function testRootAsArray() {
    console.log("Running: testRootAsArray");
    const item = { id: "item" };
    const input = [item, { link: item }];

    const json = stringify(input);
    assert(json.startsWith("["), "Should be an array string");
    console.log("testRootAsArray json=" + json);

    const output = parse(json);
    assert(Array.isArray(output), "Output should be an array");
    assert(output[0] === output[1].link, "Root array indexing failed");
}

/**
 * Tests complex circularity where multiple objects point to each other.
 */
function testCircularReferenceComplex() {
    console.log("Running: testCircularReferenceComplex");
    const nodeA = { name: "A" };
    const nodeB = { name: "B" };
    const nodeC = { name: "C" };

    nodeA.next = nodeB;
    nodeB.next = nodeC;
    nodeC.next = nodeA; // Loop

    const input = { start: nodeA, list: [nodeA, nodeB, nodeC] };
    const json = stringify(input);
    console.log("testCircularReferenceComplex json=" + json);

    const output = parse(json);
    const a = output.start;
    const b = a.next;
    const c = b.next;

    assert(c.next === a, "Circular loop A->B->C->A failed");
    assert(output.list[0] === a, "List ref A failed");
    assert(output.list[1] === b, "List ref B failed");
    assert(output.list[2] === c, "List ref C failed");
}

/**
 * Tests that invalid pointers throw appropriate errors during parsing.
 */
function testInvalidPointerResolution() {
    console.log("Running: testInvalidPointerResolution");
    const json = '{"a": {"$ref": "#/non/existent"}}';
    try {
        parse(json);
        assert(false, "Should have thrown an error for invalid pointer");
    } catch (e) {
        assert(e.message.includes("could not be resolved"), "Error message should mention resolution failure");
    }
}

// Execute the tests
try {
    console.log("Starting JREF Tests...\n");

    testBasicFunctionality();
    testObjectArrayRef();
    testStringArrayRef();
    test2DObjectArrayRef();
    testMapValueRef();
    testMapValueMultRef();
    testCircularReference();
    testDeeplyNestedTree();
    testEscapedCharactersInKeys();
    testMultipleRefsToSameObject();
    testArrayOfSameObjects();
    testNullAndUndefinedValues();
    testMixedArrayTypes();
    testRootAsArray();
    testCircularReferenceComplex();
    testInvalidPointerResolution();

    console.log("\nAll tests completed successfully.");
} catch (e) {
    console.error("Test suite failed!");
    console.error(e);
    process.exit(1);
}

