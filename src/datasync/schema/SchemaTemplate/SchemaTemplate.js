(function(schemaFactories, is){

	function SchemaTemplate(config){

		this._ = {
			config:config,
			root:null
		};

		init(this);

	}

	/*----------  class methods  ----------*/
	SchemaTemplate.prototype.applyTo = function(dataset){
		this._.root.applyTo(dataset);
	};	
	/*----------  static methods  ----------*/
	SchemaTemplate.isValidConfiguration = function(){

	};
	
	/*----------  utils  ----------*/
	function init(self){
		//initialize the root of the schema configuration
		//(this is a recursive operation)
		var rootContructor = schemaFactories.SchemaTemplateNode.provideSubclass(self._.config);
		self._.root = new rootContructor(self._.config);
	}

	//expose to namespace
	schemaFactories.SchemaTemplate = SchemaTemplate;

})(
	_private('schema.factory'),
	_private('util.is')
);