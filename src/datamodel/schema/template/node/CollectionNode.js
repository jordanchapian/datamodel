define('schema/template/node/CollectionNode',
['schema/template/node/TemplateNode'],
function(TemplateNode){
	
	function CollectionNode(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	CollectionNode.prototype = Object.create(TemplateNode.prototype);
	CollectionNode.prototype.constructor = CollectionNode;

	
	return CollectionNode;

});