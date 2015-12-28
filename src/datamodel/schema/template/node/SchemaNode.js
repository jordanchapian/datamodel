define('schema/template/node/SchemaNode',
['schema/template/node/TemplateNode'],
function(TemplateNode){
	
	function SchemaNode(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	SchemaNode.prototype = Object.create(TemplateNode.prototype);
	SchemaNode.prototype.constructor = SchemaNode;

	
	return SchemaNode;

});