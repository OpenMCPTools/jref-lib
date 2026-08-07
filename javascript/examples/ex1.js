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
// Output: [{"name":"Alice","data":"Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer","self":{"$ref":"#/0"}},{"name":"Bob","friend":{"$ref":"#/0"}},{"name":"Mallory","friend":{"$ref":"#/0"}}]
console.log("output length=" + output.length);
// Output: output length=229
// call parse
const parsed = JRef.parse(output);
console.log("parsed[0] === parsed[0].self=" + (parsed[0] === parsed[0].self)); 
console.log("parsed[1].friend === parsed[0]=" + (parsed[1].friend === parsed[0])); // true
console.log("parsed[2].friend === parsed[0]=" + (parsed[2].friend === parsed[0])); // true

