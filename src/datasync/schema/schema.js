(function(publicApi, schemaAPI, is,set, schemaFactories, info, undefined){

	var schemaMap = {};

	//public exposure
	publicApi.addSchema = function(schemaKey, schemaDefinition){
		//defend input (must have at least a path key to complete action)
		if(schemaKey === undefined || is.String(schemaKey) === false){
			info.error('addSchema Requries that at least a schemaKey[String] is provided. No recovery.');
			return;
		}
		else if(schemaDefinition !== undefined && is.Object(schemaDefinition) === false){
			info.error('addSchema Requries that the provided schemaDefinition is an object. No recovery.');
			return;
		}
		else if(schemaMap[schemaKey] !== undefined){
			info.warn('Provided multiple definitions for schama key ['+schemaKey+']. Behavior is not predictable.');
		}

		return (schemaMap[schemaKey] = new schemaFactories.Schema(schemaKey, schemaDefinition));
	};

	publicApi.getSchema = function(key){
		if(key === undefined)return set.values(schemaMap);
		else return schemaMap[key];
	};


	//private exposure
	schemaAPI.getSchema = function(key){
		if(key === undefined)return set.values(schemaMap);
		else return schemaMap[key];
	};	


})(
	_public(), 
	_private('schema'),
	_private('util.is'),
	_private('util.set'),
	_private('schema.factory'),
	_private('info')
);
