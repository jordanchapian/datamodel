define('util/schema',
[	
	'util/is'
],
function(is){

	var api = {};
	var validPrimitives = [ String, Boolean, Date, Number ];

	api.isPrimitive = function(config){
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