define('schema/template/node/PrimitiveNode',
[
	'schema/template/node/TemplateNode',
	'type/collection',
	'util/is'
],
function(TemplateNode, typeCollection, is){
	
	function PrimitiveNode(config, accessKey){
		//call super class constructor
		TemplateNode.apply(this, arguments);

		this._.type = typeCollection.get_fromAlias((is.Function(config) ? config : config._value));
	}

	/*----------  inherit properties from super class  ----------*/
	PrimitiveNode.prototype = Object.create(TemplateNode.prototype);
	PrimitiveNode.prototype.constructor = PrimitiveNode;

	PrimitiveNode.prototype.validate = function(datum){
		if(!this._.type) return false;
		else return this._.type.validate(datum);
	};

	return PrimitiveNode;

});