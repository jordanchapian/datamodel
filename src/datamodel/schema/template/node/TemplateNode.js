define('schema/template/node/TemplateNode',
[
	'util/is', 
	'util/schema', 
	'info'
],
function(is, schemaUtil, info){
	
	function TemplateNode(configuration, accessKey){
		
		this._ = {
			config:configuration,
			children:[]
		};

	}
	
	/*----------  class methods  ----------*/
	TemplateNode.prototype.addChildren = function(node){

		//ensure that this is an instance of TemplateNode (subclass)
		if((node instanceof TemplateNode) === false){
			info.warn('Something is wrong, we are assigning a template node of the wrong type');
		}
		else {
			this._.children.push(node);
		}

	};

	/*----------  utils  ----------*/
	
	// function init(self){
	// 	assignChildren(self);
	// }

	// function assignChildren(self){
	// 	// var config = self._.config;

	// 	// //we just create a single child, and that is the iterative relationship
	// 	// if(schemaUtil.isCollection(config) && config.length > 0){
	// 	// 	var childConstructor = schemaUtil.getNodeConstructor(config[0]);
	// 	// 	self._.children.push( new childConstructor(config[0]) );
	// 	// }
	// 	// //a schema is to need to create child nodes for each of it's first level properties
	// 	// else if(schemaUtil.isSchema(config)){
	// 	// 	for(var key in config){
	// 	// 		var childConstructor = schemaUtil.getNodeConstructor(config[key]);
	// 	// 		self._.children.push( new childConstructor(config[key], key) );
	// 	// 	}
	// 	// }
	// }

	return TemplateNode;
});