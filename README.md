# datamodel
Javascript data schemas. Validate data structures, ensure data types, assign virtual methods, generate virtual properties for a data set.
# Installing
## Via Bower
```bash
bower install datamodel.js --save
```
## Via NPM
```bash
npm install datamodel.js --save
```

# Creating a Dataset Model
The dataset schema is to define what the expected format of a dataset is to be. There are three patterns that are used: Collections, Schemas (and nested schemas), and primitives. Further, there are two ways to define a schema: Caching, or instance.
## Primitive Pattern
Primitives are the most basic element, and end recursive checks. You use primitives to define the type pattern required for proper use.

###Example:A string
```javascript
datamodel('personName')
.setTemplate(String);
```
###Example:An array of strings
```javascript
datamodel('personName')
.setTemplate([String]);
```

###Example:An array objects with a string property
```javascript
datamodel('personName')
.setTemplate([{ name:String }]);
```

##Schema Pattern
A schema definition has a similar meaning to what what is understood as the Object javascript primitive. It is a definition of a key/value data structure, and uses the Object primitive syntax for defining the pattern. Nested schemas are supported for complex objects.

###Example: A basic schema
```javascript
datamodel('person')
.setTemplate({
	name:String,
	age:Number
});
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
```

###Example: Describe a simple object with an array
```javascript
datamodel('myHits')
.setTemplate({
	name:String,
	hits:[Number]
});
```

#Validating Against Models
##Examples

###Example 1:
```javascript
datamodel('personName')
.setTemplate(String);

var ValidData = "Jordan";
var InvalidData = 23; //wrong type...

datamodel('personName')
.validate(ValidData); //true

datamodel('personName')
.validate(InvalidData); //false
```

###Example 2:
```javascript
datamodel('personName')
.setTemplate([String]);

var ValidData = ["Jordan", "Chapian"];
var InvalidData = [23, "Jordan"]; //wrong type

datamodel('personName')
.validate(ValidData); //true

datamodel('personName')
.validate(InvalidData); //false
```
###Example 3:
```javascript
datamodel('personName')
.setTemplate([{name:String}]);

var ValidData = [{name:"Jordan"}, {name:"Chapian"}];
var InvalidData = [{name:"Jordan"}, "Jordan"]; //wrong type

datamodel('personName')
.validate(ValidData); //true

datamodel('personName')
.validate(InvalidData); //false
```

###Example 4:
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

###Example 5:
```javascript
datamodel('person')
.setTemplate({
	name:String,
	details:{
		age:Number
	}
});

var ValidData = {name:'Jordan', details:{age:10}};
var InvalidData = {name:'Jordan', details:{age:"10"}}; //age, wrong type..

datamodel('person')
.validate(ValidData); //true

datamodel('person')
.validate(InvalidData); //false
```

###Example 6:
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

###Example 7:
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