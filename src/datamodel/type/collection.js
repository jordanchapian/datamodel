define('type/collection',
[
	'type/Type',
	'type/Number'
],
function(Type){

	var types = {};
	
	//set up the collection based on the stored configurations
	for(var i = 1; i < arguments.length; i++){

		if(validTypeConfig(arguments[i])){
			types[arguments[i].name] = new Type(arguments[i]);
		}
		else{

		}

	}


	return types;


	/*----------  utils  ----------*/
	
	function validTypeConfig(typeConfig){
		return true;
	}

})