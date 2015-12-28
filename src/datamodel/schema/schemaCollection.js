define('schema/schemaCollection',
['util/is', 'util/set', 'info', 'schema/Schema'],
function(is, set, info, Schema){
	var schemaMap = {};

	var api = {};
	
	//public exposure
	api.addSchema = function(schemaKey, schemaDefinition){
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

		return (schemaMap[schemaKey] = new Schema(schemaKey, schemaDefinition));
	};

	api.getSchema = function(key){
		if(key === undefined)return set.values(schemaMap);
		else return schemaMap[key];
	};

	return api;
});