//all imports after info are to be type configurations
define('type/collection',
[
	'type/Type',
	'info',
	'util/set',

	'type/config/Number',
	'type/config/Date',
	'type/config/String'
],
function(Type, info, set){

	var types_map = {},
			types_arr = [];

	//set up the collection based on the stored configurations
	for(var i = 3; i < arguments.length; i++){
		//are we overwriting another type?
		if(types_map[arguments[i].name]){
			info.warn('Overwriting type names');
		}
		//we are ok
		else{
			types_map[arguments[i].name] = new Type(arguments[i]);
		}
	}
	
	//store a type array accessor
	types_arr = set.values(types);

	//expose an api to collection
	var api = {};

	api.get = function(){
		return types_arr;
	};

	api.get_fromAlias = function(aliasFN){
		
		for(var i = 0; i < types_arr.length; i++){
			if(types_arr[i].getAccessor() === aliasFN) return types_arr[i];
		}

	};

	api.get_fromName = function(name){
		return types_map[name];
	};	

	return api;

})