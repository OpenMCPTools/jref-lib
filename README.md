# jref-lib

## What is JRef?

JSON Reference (JRef) extends JSON with a reference type. References allow for
circular data to be serialized as JSON or for duplicated data to be serialized
more efficiently (i.e. without multiple copies). References take the form of `{ "$ref": "#/path/to/target" }`
where the URL fragment is a JSON Pointer ([rfc-6901](https://datatracker.ietf.org/doc/html/rfc6901)) 
locating a position in the document. As open specifications, JRef+JSON Pointer 
provide cross-language inter-operability for references.

Duplicated data are common in complex data structures (e.g. trees and other graphs). If such data
are serialized (e.g. for network transmission) then usage of JRef+JSON Pointers 
can be much more efficient.

The JRef specification can be used to reference locations in external documents as well, but the current
implementations only supports references local to the current document (local-only). In most cases, 
the jref-lib implementations below can be easily enhanced to support remote references.

See the
[JRef Specification](https://github.com/hyperjump-io/json-reference/blob/main/spec.md)
for more information on the full specification and
[@hyperjump/browser](https://github.com/hyperjump-io/browser) for a full
implementation supporting external references.

## What is jref-lib?

This repo provides implementations of Jref (local-only) for *existing* serialization/deserialization
libraries in multiple languages. Here are the target implementations (more/others can/may be added, and
contributions and integrations welcome):

* [Jackson 3](java/jref-jackson) - Status: Impl complete, tested, [upstream pr submitted](https://github.com/FasterXML/jackson-databind/pull/6045)
* [Gson](java/gref-gson) - Status: Impl complete, tested, [upstream pr submitted](https://github.com/google/gson/pull/3050)
* [javascript](javascript/) - Status: JREF.stringify and JREF.parse complete.  Testing begun.
* Pydantic - Status: In progress

## Standalone JRef Impls

There are also complete, stand-alone serialization/deserialization impls in the following seaprate
repos. These implementations provide JRef local-only impls without any library dependencies.

* [jref-typescript](https://github.com/OpenMCPTools/jref_typescript) - Status: tested impl
* [jref-java](https://github.com/OpenMCPTools/jref_java) - Status: tested impl
* [jref-python](https://github.com/OpenMCPTools/jref_python) - Status: tested impl
* [jref-rust](https://github.com/OpenMCPTools/jref_rust) - Status: impl (no testing)





