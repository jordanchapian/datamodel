define('schema/template/node/PrimitiveNode',
[
	'schema/template/node/TemplateNode',
	'util/is'
],
function(TemplateNode, is){
	
	function PrimitiveNode(config, accessKey){
		//call super class constructor
		TemplateNode.apply(this, arguments);

		this._.type = is.Function(config) ? config : config._value;
	}

	/*----------  inherit properties from super class  ----------*/
	PrimitiveNode.prototype = Object.create(TemplateNode.prototype);
	PrimitiveNode.prototype.constructor = PrimitiveNode;

	PrimitiveNode.prototype.validate = function(datum){
		if(this._.type === String && is.String(datum) === false)
			return false;
		else if(this._.type === Boolean && is.Boolean(datum) === false)
			return false;
		else if(this._.type === Date && is.Date(datum) === false)
			return false;
		else if(this._.type === Number && is.Number(datum) === false)
			return false;
		else 
			return true;
	};

	return PrimitiveNode;

});