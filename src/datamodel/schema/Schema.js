define('schema/Schema',
['info','util/is', 'schema/template/SchemaTemplate'],
function(info, is, SchemaTemplate){

	function Schema(key, config){
		//private collections
		this._ = {
			//the key assigned to this schema
			key:key,

			//a store of the provided configuration
			template:null,

			//map of virtual properties
			virtual:{}
		};


		//init from config
		if(config !== undefined)
			this.setTemplate(config);
	}

	Schema.prototype.setTemplate = function(templateDefinition){
		if(is.Object(templateDefinition) === false && is.Array(templateDefinition) === false){
			info.warn('Template definition base must be an object or an array. Definition not assigned.');
			return this;
		}
		else if(this._.templateDefinition !== null){
			info.warn('Overwriting template definition for ['+this._.key+'] multiple times. Behavior may difficult to predict.');	
		}
		
		//initialize references to this new template definition
		this._.template = (new SchemaTemplate(templateDefinition));

		return this;
	};

	
	Schema.prototype.applyTo = function(data){
		console.log(this._)
		this._.template.applyTo(data);
	};


	/*----------  virtuals  ----------*/
	
	function addVirtual_sl(self, name, fn){
		if(name === undefined || is.String(name) === false
			|| fn === undefined || is.Function(fn) === false){
			info.warn('Invalid input provided to addVirtual. No action taken.');
			return self;
		}
		else if(self._.virtual[name] !== undefined){
			info.warn('Multiple definitions for virtual property ['+name+'] in schema ['+self._.key+']');
		}

		//take action
		self._.virtual[name] = fn;

		return self;
	}

	function addVirtual_ml(self, name){
		return function(fn){
			return addVirtual_sl(self, name, fn);
		}
	}

	Schema.prototype.addVirtual = function(name, fn){
		if(name === undefined && fn === undefined){
			info.warn('no input provided to addVirtual. No action taken');
			return this;
		}
		else if(fn === undefined){//multi level add
			return addVirtual_ml(this, name);
		}
		else{//single level add
			return addVirtual_sl(this, name, fn);
		}
	};

	return Schema;
});


