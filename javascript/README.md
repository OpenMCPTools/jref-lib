
# jref-lib js

A lightweight JavaScript utility for efficiently `stringify` and `parse` JSON with support for complex structures (e.g. trees and some graphs) using JSON Pointers specification ([rfc 6901](https://datatracker.ietf.org/doc/html/rfc6901)) and the local-only [JSON Reference (JREF)](https://github.com/json-schema-org/referencing/blob/main/jdesrosiers-jref.md) specification.

---
## Overview

Standard `JSON.stringify` inefficiently duplicates object data when the same instance is referenced in multiple locations within the source object graph. `jref-lib js` solves this by:
1.  **Efficiently serializing duplicate references**: For complex data structures (e.g. trees and other graphs) replacing memory references with JSON pointers will frequently result in less data and more efficient network transmission.  
2.  **Handling circularity**: Safely serializing and parsing objects that point back to themselves.
3.  **Restoring object identity on deserialization**: Ensuring that after parsing, multiple references to the same original object point to the same memory instance.

NOTE: Complex object graphs cannot be fully represented by JREF.stringify output (a tree). It's therefore necessary for JRef input to be constrained by the use case. For example, data structures with cycles should usually be transformed prior to being serialized. [Here](https://github.com/douglascrockford/JSON-js/blob/master/cycle.js) is a utility to support some such transformations.

---
## Installation

```bash
git clone https://github.com/OpenMCPTools/jref-lib.git
cd jref-lib/javascript
npm install
```

---

## API Reference

The JRef stringify/parse API exactly duplicates the `JSON.stringify` and `JSON.parse` API as given
in [ECMAscript 2027 JSON documentation](https://tc39.es/ecma262/multipage/structured-data.html#sec-json-object)

### `stringify(value[, replacer[, space]])`
- `value`: The object to serialize.
- `replacer`: A function or array to transform the output.
- `space`: Adds indentation/whitespace to the output string.
- [ECMAscript 2027 arguments documentation](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.stringify)

### `parse(text[, reviver])`
- `text`: The JREF-encoded JSON string.
- `reviver`: A function to transform the resulting object.
- [ECMAscript 2027 arguments documentation](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.parse)
---

## Usage Examples

### 1. Circular References
Standard `JSON.stringify` throws a `TypeError` on circular structures. `jref-js` handles them seamlessly.

```javascript
import * as JRef from './src/jref.js';

const user = { name: "Alice" };
user.self = user; // Circular reference

const json = JRef.stringify(user);
console.log(json); 
// Output: {"name":"Alice","self":{"$ref":"#"}}

const parsed = JRef.parse(json);
console.log(parsed === parsed.self); // true
```

### 2. Preserving Object Identity (Deduplication)
When the same object is referenced multiple times, `jref-js` ensures they point to the same instance after parsing.

```javascript
const sharedMetadata = { version: "1.0.0" };
const data = {
  config: sharedMetadata,
  settings: sharedMetadata
};

const json = JRef.stringify(data);
console.log(json);
// Output: {"config":{"version":"1.0.0"},"settings":{"$ref":"#/config"}}

const parsed = JRef.parse(json);
console.log(parsed.config === parsed.settings); // true
```

### 3. Efficient Tree Serialization/Deserialization

```javascript
// JREF stringify and parse
import * as JRef from '../src/jref.js';

const user1 = { name: "Alice", data: "Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer" };
const user2 = { name: "Bob" }; 
const user3 = { name: "Mallory" };

user1.self = user1; // Circular reference
user2.friend = user1; // reference to Alice
user3.friend = user1; // reference to Alice
const input = [ user1, user2, user3 ];
// call stringify
const output = JRef.stringify(input);
console.log(output); 
console.log("output length=" + output.length);
// call parse
const parsed = JRef.parse(output);
console.log("parsed[0] === parsed[0].self=" + (parsed[0] === parsed[0].self)); 
console.log("parsed[1].friend === parsed[0]=" + (parsed[1].friend === parsed[0])); console.log("parsed[2].friend === parsed[0]=" + (parsed[2].friend === parsed[0])); 
```
This example also can be found in [examples/ex1.js](examples/ex1.js).  

Here is the output from running the above

```console
[{"name":"Alice","data":"Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer","self":{"$ref":"#/0"}},{"name":"Bob","friend":{"$ref":"#/0"}},{"name":"Mallory","friend":{"$ref":"#/0"}}]
output length=229
parsed[0] === parsed[0].self=true
parsed[1].friend === parsed[0]=true
parsed[2].friend === parsed[0]=true
```

Here is the output using only `JSON.stringify` and `JSON.parse`

```console
[{"name":"Alice","data":"Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer"},{"name":"Bob","friend":{"name":"Alice","data":"Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer"}},{"name":"Mallory","friend":{"name":"Alice","data":"Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer"}}]
output length=425
parsed[0] === parsed[0].self=false
parsed[1].friend === parsed[0]=false
parsed[2].friend === parsed[0]=false
```

This example also can be found in [examples/ex2.js](examples/ex2.js).  

### 3. Using Replacers and Revivers
You can still use [standard JSON features]() with JRef like replacer functions.

```javascript
const input = { id: 1, secret: "hidden", link: null };
input.link = input;

const json = JRef.stringify(input, (key, value) => {
  if (key === 'secret') return undefined; // Filter out sensitive data
  return value;
});

const parsed = JRef.parse(json);
console.log(parsed.secret); // undefined
console.log(parsed.link === parsed); // true
```

