define('util/schema',
[	
	'util/is',
	'type/collection'
],
function(is, typeCollection){

	var api = {};
	var validPrimitives = [ String, Boolean, Date, Number ];

	api.isPrimitive = function(config){
		var type;

		//need to determine if this method 0, (just specifying type alias)
		if(is.Function(config)){
			
		}
		//or if this is mehthod 1, specifying a _type with options in an object
		else if(is.Object(config)){

		}

		//handle configuration object and basic function cases
		return ((is.Function(config) && validPrimitives.indexOf(config) != -1)
					 || (is.Object(config) && config._type !== undefined));
	};

	api.isCollection = function(config){
		return (is.Array(config));
	};

	api.isSchema = function(config){
		return (is.Object(config) && config._type === undefined);
	};


	return api;
});