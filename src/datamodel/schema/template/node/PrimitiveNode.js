define('schema/template/node/PrimitiveNode',
['schema/template/node/TemplateNode'],
function(TemplateNode){
	
	function PrimitiveNode(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	PrimitiveNode.prototype = Object.create(TemplateNode.prototype);
	PrimitiveNode.prototype.constructor = PrimitiveNode;

	
	return PrimitiveNode;

});