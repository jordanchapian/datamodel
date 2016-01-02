//types are for primitives...
define('type/config/Number',['util/is'],
function(is){

	return {
		//the name associated with this type...
		name:'Number',

		//the accessor is what is used to identify a type
		//custom types expose some kind of accessor, and
		//expose these under types like datapath.types.ObjectId
		accessorAlias:Number,

		//the options that this type accepts
		options:['range'],

		//this is required for validation.
		//the datum to be validated is passed in as the first argument
		//and the options specified for the schema primitive are passed in
		//so that decisions can be made dynamically...
		isValid:function(datum, options){
			return is.Number(datum);
		}

	};

});