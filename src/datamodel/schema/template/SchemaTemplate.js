define('schema/template/SchemaTemplate',
['util/is','util/schema', 'schema/template/node/TemplateNode'],
function(is, schemaUtil, TemplateNode){
	
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
		var rootContructor = schemaUtil.getNodeConstructor(self._.config);
		self._.root = new rootContructor(self._.config);
	}

	//expose to namespace
	return SchemaTemplate;

});
