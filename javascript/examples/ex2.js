// JSON.stringify/parse only

const user1 = { name: "Alice", data: "Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer" };
const user2 = { name: "Bob" }; 
const user3 = { name: "Mallory" };

// user1.self = user1; // Circular reference NOT supported
user2.friend = user1; // reference to Alice
user3.friend = user1; // reference to Alice
const input = [ user1, user2, user3 ];

// call stringify
const output = JSON.stringify(input);
console.log(output); 
// Output: [{"name":"Alice","data":"Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer"},{"name":"Bob","friend":{"name":"Alice","data":"Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer"}},{"name":"Mallory","friend":{"name":"Alice","data":"Alice is a caring, kind, and thoughtful person.  She is also an excellent, conscientious engineer"}}]
console.log("output length=" + output.length);
// Output: output length=425

// call parse
const parsed = JSON.parse(output);
console.log("parsed[0] === parsed[0].self=" + (parsed[0] === parsed[0].self)); 
console.log("parsed[1].friend === parsed[0]=" + (parsed[1].friend === parsed[0])); // false
console.log("parsed[2].friend === parsed[0]=" + (parsed[2].friend === parsed[0])); // false
