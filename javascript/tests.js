import { parse, stringify } from './JREF.js';

/**
 * Test code for JREF.stringify and JREF.parse functions.
 * These tests are inspired by the Jackson JRef test cases.
 */

function runTests() {
    console.log("Starting JREF Tests...\n");

    testBasicFunctionality();
    testObjectArrayRef();
    testStringArrayRef();
    test2DObjectArrayRef();
    testMapValueRef();
    testMapValueMultRef();
    testCircularReference();

    console.log("\nAll tests completed.");
}

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
    console.log("stringify result=" + txt);
    assertJRefCount(txt, 1);

    let result = parse(txt);
    console.log("parse result=" + JSON.stringify(result));
    
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
    console.log("testObjectArrayRef result=" + out);
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
    console.log("testStringArrayRef result=" + out);
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
    console.log("test2DObjectArrayRef result=" + out);
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
    console.log("testMapValueRef result=" + out);
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
    console.log("testMapValueMultRef result=" + out);
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
    console.log("testCircularReference result=" + out);
    assertJRefCount(out, 1);
    
    let result = parse(out);
    assert(result.friend.friend === result, "Circular reference should be restored");
    assertEquals(result.name, "A", "Root name should be A");
    assertEquals(result.friend.name, "B", "Friend name should be B");
}

// Execute the tests
try {
    runTests();
} catch (e) {
    console.error("Test suite failed!");
    console.error(e);
    process.exit(1);
}
