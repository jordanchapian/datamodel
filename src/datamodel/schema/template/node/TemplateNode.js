define('schema/template/node/TemplateNode',
['util/is', 'util/schema'],
function(is, schemaUtil){
	
	function TemplateNode(configuration, accessKey){
		
		this._ = {
			config:configuration,
			children:[]
		};

		//run init
		init(this);
	}
	
	/*----------  class methods  ----------*/
	TemplateNode.prototype.isPrimitive = function(){
		return this instanceof schemaFactories.STN_Primitive;
	};

	TemplateNode.prototype.isCollection = function(){
		return this instanceof schemaFactories.STN_Collection;
	};

	TemplateNode.prototype.isSchema = function(){
		return this instanceof schemaFactories.STN_Schema;
	};

	/*----------  utils  ----------*/
	
	function init(self){
		assignChildren(self);
	}

	function assignChildren(self){
		var config = self._.config;
		
		//we just create a single child, and that is the iterative relationship
		if(schemaUtil.isCollection(config) && config.length > 0){
			var childConstructor = schemaUtil.getNodeConstructor(config[0]);
			self._.children.push( new childConstructor(config[0]) );
		}
		//a schema is to need to create child nodes for each of it's first level properties
		else if(schemaUtil.isSchema(config)){
			for(var key in config){
				var childConstructor = schemaUtil.getNodeConstructor(config[key]);
				self._.children.push( new childConstructor(config[key], key) );
			}
		}
	}

	return TemplateNode;
});