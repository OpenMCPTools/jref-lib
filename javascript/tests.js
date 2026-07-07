import { parse, stringify } from './JREF.js';


let props = { "p": 1 }
let inputValue = {"items": [{ "name": "sam", "parent:": null, "props": props},{ "name": "wendy", "parent": null, "moreProps": props}]};

let txt = stringify(inputValue);

console.log("stringify result="+txt);

let result = parse(txt);
console.log("parese result="+result);


