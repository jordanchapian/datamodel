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
	
	/*----------  static methods  ----------*/
	
	/*----------  utils  ----------*/
	function init(self){
		//initialize the root of the schema configuration
		//(this is a recursive operation)
		var rootContructor = getNodeConstructor(self._.config);
		self._.root = new rootContructor(self._.config);

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
