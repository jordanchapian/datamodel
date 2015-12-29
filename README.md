# datamodel
Javascript data schemas. Validate data structures, ensure data types, assign virtual methods, generate virtual properties for a data set.

# Creating a Dataset Schema
The dataset schema is to define what the expected format of a dataset is to be. There are three patterns that are used: Collections, Schemas (and nested schemas), and primitives. Further, there are two ways to define a schema: Caching, or instance.
## Collection Pattern
A collection defines repetition in a data set. The collection is denoted with the array primitive syntax:

''''javascript
datamodel('pageHits')
.setTemplate([{
	name:String,
	hits:Number
}]);

var ValidDataset = [{name:"Jordan", hits:5}, {name:"Chapian", hits:8}];
var InvalidDataset = [{name:"Jordan", hits:"5"}, {name:"Chapian", hits:8}];

datamodel('pageHits')
.validate(MyDataset); //true

datamodel('pageHits')
.validate(InvalidDataset); //false
''''

