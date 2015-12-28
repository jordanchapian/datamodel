(function(schemaFactories, typeCode, is){
	
	function STN_Primitive(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	STN_Primitive.prototype = Object.create(schemaFactories.SchemaTemplateNode.prototype);
	STN_Primitive.prototype.constructor = STN_Primitive;
	
	schemaFactories.STN_Primitive = STN_Primitive;

})(
	_private('schema.factory'),
	_private('util.is')
);