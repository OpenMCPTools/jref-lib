
# jref-js

A lightweight JavaScript utility for serializing and deserializing JSON with support for object references and circular structures using the JSON Reference (JREF) format and JSON Pointers ([rfc 6901](https://datatracker.ietf.org/doc/html/rfc6901)).

## Overview

Standard `JSON.stringify` fails when encountering circular references and duplicates object data when the same instance is referenced in multiple places. `jref-js` solves this by:
1.  **Detecting duplicate references**: Replacing subsequent occurrences of an object with a `$ref` path.
2.  **Handling circularity**: Safely serializing objects that point back to themselves.
3.  **Restoring object identity**: Ensuring that after parsing, multiple references to the same original object point to the same memory instance.
