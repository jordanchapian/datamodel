define('datamodel',
[
	'schema/schemaCollection',
	'util/is',
	'schema/Schema'
],
function(schemaCollection, is, Schema){
	
	return function(schemaName, schemaConfig){
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
});