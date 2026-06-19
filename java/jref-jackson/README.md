# JRef for Jackson 3 ObjectMapper

This project implements a Jackson 3 [ObjectMapper](https://www.baeldung.com/jackson-object-mapper-tutorial) module for serializing and deserializing local-only JSON object references (JRef).

For an explanation of JSON object references/JRefs and links to relevant
specifications, see [here](src/main/java/org/openmcptools/jref/jackson/JRefModule.java).

## Adding JRefModule to JsonMapper.Builder

```java
// create builder
JsonMapper.Builder builder = JsonMapper.builder();
// register JRefModule() with builder
builder.addModule(new JRefModule());
...add other modules or change ObjectMapper config
// create ObjectMapper
ObjectMapper mapper = builder.create();
```

## Object Serialization 

Let's assume we have are creating a simple tree, with a 'top'/root node
and three child nodes that all have a single root node.

Here's a Java record to define our TreeNode type

```java
	record TreeNode(TreeNode parent, String name, String data) {}

```
### Building a two-level tree, with 3 child nodes

Let's start with a single root node and three child/leaf nodes

```java
	TreeNode[] buildTwoLevelThreeChildrenArray() {
		TreeNode topNode = new TreeNode(null, "top", ADDRESS);
		// Create three children
		TreeNode firstChild = new TreeNode(topNode, "child1", "data1");
		TreeNode secondChild = new TreeNode(topNode, "child2", "data2");
		TreeNode thirdChild = new TreeNode(topNode, "child3" , "data3");
		// Put top and children in array
		return new TreeNode[] { topNode, firstChild, secondChild, thirdChild };
	}
```

Then, use Jackson ObjectMapper (with JRefModule) to serialize this node array to a String:

```java
		ObjectMapper mapper = buildObjectMapperWithJRefSupport();
		String json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(buildTwoLevelThreeChildrenArray());
```

The value of json will be

```json
[ {
  "parent" : null,
  "name" : "top",
  "data" : "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.\r\n\r\nNow we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.\r\n\r\nBut, in a larger sense, we can not dedicate -- we can not consecrate -- we can not hallow -- this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us -- that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion -- that we here highly resolve that these dead shall not have died in vain -- that this nation, under God, shall have a new birth of freedom -- and that government of the people, by the people, for the people, shall not perish from the earth."
}, {
  "parent" : {
    "$ref" : "#/0"
  },
  "name" : "child1",
  "data" : "data1"
}, {
  "parent" : {
    "$ref" : "#/0"
  },
  "name" : "child2",
  "data" : "data2"
}, {
  "parent" : {
    "$ref" : "#/0"
  },
  "name" : "child3",
  "data" : "data3"
} ]
```

Note the three occurrences of '{ "$ref" : "#/0" }' for the child1.parent, child2.parent, child3.parent nodes.  These are inserted by the JRefModule for the JRefs local-only references to the root treenode.  Without the JRefModule, Jackson 3 will produce the following json for this same tree structure

```json
[ {
  "parent" : null,
  "name" : "top",
  "data" : "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.\r\n\r\nNow we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.\r\n\r\nBut, in a larger sense, we can not dedicate -- we can not consecrate -- we can not hallow -- this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us -- that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion -- that we here highly resolve that these dead shall not have died in vain -- that this nation, under God, shall have a new birth of freedom -- and that government of the people, by the people, for the people, shall not perish from the earth."
}, {
  "parent" : {
    "parent" : null,
    "name" : "top",
    "data" : "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.\r\n\r\nNow we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.\r\n\r\nBut, in a larger sense, we can not dedicate -- we can not consecrate -- we can not hallow -- this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us -- that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion -- that we here highly resolve that these dead shall not have died in vain -- that this nation, under God, shall have a new birth of freedom -- and that government of the people, by the people, for the people, shall not perish from the earth."
  },
  "name" : "child1",
  "data" : "data1"
}, {
  "parent" : {
    "parent" : null,
    "name" : "top",
    "data" : "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.\r\n\r\nNow we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.\r\n\r\nBut, in a larger sense, we can not dedicate -- we can not consecrate -- we can not hallow -- this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us -- that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion -- that we here highly resolve that these dead shall not have died in vain -- that this nation, under God, shall have a new birth of freedom -- and that government of the people, by the people, for the people, shall not perish from the earth."
  },
  "name" : "child2",
  "data" : "data2"
}, {
  "parent" : {
    "parent" : null,
    "name" : "top",
    "data" : "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.\r\n\r\nNow we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.\r\n\r\nBut, in a larger sense, we can not dedicate -- we can not consecrate -- we can not hallow -- this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us -- that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion -- that we here highly resolve that these dead shall not have died in vain -- that this nation, under God, shall have a new birth of freedom -- and that government of the people, by the people, for the people, shall not perish from the earth."
  },
  "name" : "child3",
  "data" : "data3"
} ]
```

For every duplicate reference to the root, a new copy of the root is
serialized to the output.

## Object Deserialization

Assuming the JRefModule has been added to the created ObjectMapper as
above, deserializing the string output (with jrefs) to a Node[] can be done

```
String json = ...
ObjectMapper mapper = buildObjectMapperWithJRefSupport();
TreeNode[] nodes = mapper.readValue(json, TreeNode[].class);
```

And nodes will have each child's parent JRefs property resolved to the root,
so that a check for these references

```java
		assertEquals(nodes[0],nodes[1].parent);
		assertEquals(nodes[0],nodes[2].parent);
		assertEquals(nodes[0],nodes[3].parent);
```

will succeed.

See [this test class](src/test/java/org/openmcptools/jref/jackson/test/JRefSimpleNestedTypeTest.java) for the code and data shown above.




