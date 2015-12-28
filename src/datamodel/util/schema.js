define('util/schema',
[	
	'schema/template/node/CollectionNode',
	'schema/template/node/PrimitiveNode',
	'schema/template/node/SchemaNode',
	'util/is'
],
function(CollectionNode, PrimitiveNode, SchemaNode, is){

	var utils = {};
	var validPrimitives = [ String, Boolean, Date, Number ];

	utils.getNodeConstructor = function(config){
		if(utils.isPrimitive(config)) return PrimitiveNode;
		else if(utils.isCollection(config)) return CollectionNode;
		else if(utils.isSchema(config)) return SchemaNode;
		else return undefined;
	};

	utils.isPrimitive = function(config){
		//handle configuration object and basic function cases
		return ((is.Function(config) && validPrimitives.indexOf(config) != -1)
					 || (is.Object(config) && config._type !== undefined));
	};

	utils.isCollection = function(config){
		return (is.Array(config));
	};

	utils.isSchema = function(config){
		return (is.Object(config) && config._type === undefined);
	};

});