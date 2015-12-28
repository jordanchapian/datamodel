(function(schemaFactories, typeCode, is){
	
	function STN_Collection(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);
		
	}

	/*----------  inherit properties from super class  ----------*/
	STN_Collection.prototype = Object.create(schemaFactories.SchemaTemplateNode.prototype);
	STN_Collection.prototype.constructor = STN_Collection;


	schemaFactories.STN_Collection = STN_Collection;

})(
	_private('schema.factory'),
	_private('util.is')
);