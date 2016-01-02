define('datamodel',
[
	'schema/schemaCollection',
	'type/collection',
	'util/is',
	'schema/Schema'
],
function(schemaCollection,typeCollection, is, Schema){
	
	function DatamodelPublicApi(schemaName, schemaConfig){
		//normalize input to def
		if(schemaName !== undefined && is.String(schemaName) === false){
			schemaConfig = schemaName;
			schemaName = undefined;
		}

		//if we want just an instance template
		if(schemaName === undefined){
			return (new Schema(schemaName,schemaConfig));
		}
		//if we want to get/set from a collection
		else if(is.String(schemaName)){
			return schemaCollection.getSchema(schemaName)
							|| schemaCollection.addSchema(schemaName, schemaConfig);
		}

	};
	

	//extend api with static methods that will allow users to reference types
	DatamodelPublicApi.type = {};

	typeCollection.forEach(function(type){
		DatamodelPublicApi.type[type.getName()] = type.getAccessor();
	});

	return DatamodelPublicApi
});