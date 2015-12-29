# datamodel
Javascript data schemas. Validate data structures, ensure data types, assign virtual methods, generate virtual properties for a data set.

# Creating a Dataset Schema
The dataset schema is to define what the expected format of a dataset is to be. There are three patterns that are used: Collections, Schemas (and nested schemas), and primitives. Further, there are two ways to define a schema: Caching, or instance.

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

