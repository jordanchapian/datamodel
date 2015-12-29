# datamodel
Javascript data schemas. Validate data structures, ensure data types, assign virtual methods, generate virtual properties for a data set.

# Creating a Dataset Schema
The dataset schema is to define what the expected format of a dataset is to be. There are three patterns that are used: Collections, Schemas (and nested schemas), and primitives. Further, there are two ways to define a schema: Caching, or instance.

##Schema Pattern
A schema definition has a similar meaning to what what is understood as the Object javascript primitive. It is a definition of a key/value data structure, and uses the Object primitive syntax for defining the pattern. Nested schemas are supported for complex objects.

###Example: A basic schema
```javascript
datamodel('person')
.setTemplate({
	name:String,
	age:Number
});

var ValidData = {name:'Jordan', age:10};
var InvalidData = {name:'Jordan'}; //missing age..

datamodel('person')
.validate(ValidData); //true

datamodel('person')
.validate(InvalidData); //false
```

###Example: A nested Schema
```javascript
datamodel('person')
.setTemplate({
	name:String,
	details:{
		age:Number
	}
});

var ValidData = {name:'Jordan', details:{age:10}};
var InvalidData = {name:'Jordan', details:{age:"10"}}; //missing age..

datamodel('person')
.validate(ValidData); //true

datamodel('person')
.validate(InvalidData); //false
```


## Collection Pattern
A collection defines repetition in a data set. The collection is denoted with the array primitive syntax.

###Example: Describing an array of simple objects
```javascript
datamodel('pageHits')
.setTemplate([{
	name:String,
	hits:[Number]
}]);

var ValidDataset = [{name:"Jordan", hits:[5,7,6]}, {name:"Chapian", hits:[]}];
var InvalidDataset = [{name:"Jordan", hits:["5", 7, 6]}, {name:"Chapian", hits:[8]}];

datamodel('pageHits')
.validate(ValidDataset); //true

datamodel('pageHits')
.validate(InvalidDataset); //false
```

###Example: Describe a simple object with an array
```javascript
datamodel('myHits')
.setTemplate({
	name:String,
	hits:[Number]
});

var ValidDataset = {name:"Jordan", hits:[5, 10, 15, 20]};
var InvalidDataset =  {name:"Jordan", hits:12};

datamodel('myHits')
.validate(ValidDataset); //true

datamodel('myHits')
.validate(InvalidDataset); //false
```



#Schema Representation

