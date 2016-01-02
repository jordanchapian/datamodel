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

	var types = {};

	//set up the collection based on the stored configurations
	for(var i = 3; i < arguments.length; i++){
		//are we overwriting another type?
		if(types[arguments[i].name]){
			info.warn('Overwriting type names');
		}
		//we are ok
		else{
			types[arguments[i].name] = new Type(arguments[i]);
		}
	}


	return set.values(types);

})