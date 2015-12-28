(function(schemaFactories, typeCode, is){
	function SchemaTemplateNode(configuration, accessKey){
		
		this._ = {
			value:null,
			typeCode:null,//const
			config:configuration,

			accessKey:accessKey || '',
			children:[]
		};

		//run init
		init(this);
	}
	/*----------  class methods  ----------*/
	SchemaTemplateNode.prototype.isPrimitive = function(){
		return this instanceof schemaFactories.STN_Primitive;
	};

	SchemaTemplateNode.prototype.isCollection = function(){
		return this instanceof schemaFactories.STN_Collection;
	};

	SchemaTemplateNode.prototype.isSchema = function(){
		return this instanceof schemaFactories.STN_Schema;
	};

	/*----------  static methods  ----------*/
	SchemaTemplateNode.isPrimitive = function(config){
		//handle configuration object and basic function cases
		return ((is.Function(config) && (config === String || config === Boolean || config === Date || config === Number))
					 || (is.Object(config) && config._type !== undefined));
	};

	SchemaTemplateNode.isCollection = function(config){
		return (is.Array(config));
	};

	SchemaTemplateNode.isSchema = function(config){
		return (is.Object(config) && config._type === undefined);
	};

	//from the configuration provided, what datum wrapper should we use?
	SchemaTemplateNode.provideSubclass = function(config){
		if(SchemaTemplateNode.isPrimitive(config)) return schemaFactories.STN_Primitive;
		else if(SchemaTemplateNode.isCollection(config)) return schemaFactories.STN_Collection;
		else if(SchemaTemplateNode.isSchema(config)) return schemaFactories.STN_Schema;
		else return SchemaTemplateNode;
	};

	/*----------  utils  ----------*/
	function init(self){
		assignChildren(self);
	}

	function assignChildren(self){
		var config = self._.config;
		
		//we just create a single child, and that is the iterative relationship
		if(SchemaTemplateNode.isCollection(config) && config.length > 0){
			var childConstructor = SchemaTemplateNode.provideSubclass(config[0]);
			self._.children.push( new childConstructor(config[0]) );
		}
		//a schema is to need to create child nodes for each of it's first level properties
		else if(SchemaTemplateNode.isSchema(config)){
			for(var key in config){
				var childConstructor = SchemaTemplateNode.provideSubclass(config[key]);
				self._.children.push( new childConstructor(config[key], key) );
			}
		}
	}

	schemaFactories.SchemaTemplateNode = SchemaTemplateNode;

})(
	_private('schema.factory'),
	_private('schema.constant.typeCode'),
	_private('util.is')
);