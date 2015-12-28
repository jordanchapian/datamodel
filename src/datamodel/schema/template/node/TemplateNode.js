define('schema/template/node/TemplateNode',
[
	'util/is', 
	'util/schema', 
	'info'
],
function(is, schemaUtil, info){
	
	function TemplateNode(configuration){
		
		this._ = {
			config:configuration,
			children:[]
		};

	}
	
	/*----------  class methods  ----------*/
	TemplateNode.prototype.addChild = function(node){

		//ensure that this is an instance of TemplateNode (subclass)
		if((node instanceof TemplateNode) === false){
			info.warn('Something is wrong, we are assigning a template node of the wrong type');
		}
		else {
			this._.children.push(node);
		}

	};

	TemplateNode.prototype.getChildren = function(){
		return this._.children;
	};
	
	return TemplateNode;
});