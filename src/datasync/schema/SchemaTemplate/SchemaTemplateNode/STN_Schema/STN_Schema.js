(function(schemaFactories, typeCode, is){
	
	function STN_Schema(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	STN_Schema.prototype = Object.create(schemaFactories.SchemaTemplateNode.prototype);
	STN_Schema.prototype.constructor = STN_Schema;

	
	schemaFactories.STN_Schema = STN_Schema;

})(
	_private('schema.factory'),
	_private('util.is')
);