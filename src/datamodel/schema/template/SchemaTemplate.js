define('schema/template/SchemaTemplate',
[	

	'util/is',
	'util/schema', 
	'./node/CollectionNode',
	'./node/PrimitiveNode',
	'./node/SchemaNode'

],
function(is, schemaUtil, CollectionNode, PrimitiveNode, SchemaNode){
	
	function SchemaTemplate(config){

		this._ = {
			config:config,
			root:null
		};

		init(this);

	}

	/*----------  class methods  ----------*/
	SchemaTemplate.prototype.validate = function(datum){
		if(this._.root === null){
			return false;
		}
		
		else return this._.root.validate(datum);
	};
	/*----------  static methods  ----------*/
	
	/*----------  utils  ----------*/

	function assignChildren(self, root, config, accessKey){
		var configNodeConstructor = getNodeConstructor(config);
		var newNode = new configNodeConstructor(config, accessKey);
		
		//determine where to add the child
		if(root === null) self._.root = root = newNode;
		else root.addChild(newNode);

		//determine if we recursively decend into configuration
		if(configNodeConstructor === CollectionNode){
			
			//we may need to add a nested schema in the array pattern
			if(config.length === 1){
				assignChildren(self, newNode, config[0]);
			}

		}
		else if(configNodeConstructor === SchemaNode){

			for(var key in config){
				assignChildren(self, newNode, config[key], key);
			}

		}

	}

	function init(self){
		assignChildren(self, self._.root, self._.config);
	}

	function getNodeConstructor(config){
		if(schemaUtil.isPrimitive(config)) return PrimitiveNode;
		else if(schemaUtil.isCollection(config)) return CollectionNode;
		else if(schemaUtil.isSchema(config)) return SchemaNode;
		else return undefined;
	};

	
	//expose to namespace
	return SchemaTemplate;

});
