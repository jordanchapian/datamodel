(function(Datasync){
	'use strict';

	var publicAPI = Datasync,
			privateAPI = {};

	/*==================================
	=            Namespaces            =
	==================================*/

	//TODO: make this a hash, and just expose public in outro
	function _namespace(str, root) {
		if(str === undefined)return root;

		var chunks = str.split('.');
		var current = root;
		for(var i = 0; i < chunks.length; i++) {
			if (!current.hasOwnProperty(chunks[i]))
				current[chunks[i]] = {};
			current = current[chunks[i]];
		}
		
		return current;
	}

	function _public(str){
		return _namespace(str, publicAPI);
	}

	function _private(str){
		return _namespace(str, privateAPI);
	}
	/*=====  End of Namespaces  ======*/
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
(function(cacheFactory, datapathConfig, datapathAPI, paramState){
	
	function Cache(datapathKey){
		//dataframes, ordered from recent to oldest
		this._dataframes = [];
		
		//reference to the datapath object associated with this cache
		this._datapath = datapathAPI.getDatapath(datapathKey);
		this._datapathKey = datapathKey;
	}
	Cache.prototype.activeDataFrame = function(){
		return (this._dataframes.length > 0) ? this._dataframes[0] : undefined;
	};

	Cache.prototype.isCacheFull = function(){
		return (datapathConfig.cacheSize.get(this._datapathKey) === this._dataframes.length);
	};

	Cache.prototype.cacheOverflow = function(){
		return (datapathConfig.cacheSize.get(this._datapathKey) < this._dataframes.length);
	};

	//remove entire cache
	Cache.prototype.clearDataframes = function(){
		this._dataframes = [];
	};

	Cache.prototype.sync = function(cb){
		var validIndex;

		//if we have a valid frame already, we need to put it in the front of the array, and no datafetch required
		if((validIndex = validFrameIndex(this)) > -1){
			this._dataframes.splice(0, 0, this._dataframes.splice(validIndex, 1)[0]);
		}
		//we must add a new frame. (then check overflow)
		else{
			this._dataframes.splice(0,0, new cacheFactory.DataFrame(this._datapath) );
		}

		//remove an old frame if we've overflowed
		if(this.cacheOverflow()){
			this._dataframes.splice((this._dataframes.length - 1), 1);
		}

		//now we can request our dataframe to fill it's dataset from remote
		this._dataframes[0].fill(function(){
			//action is complete (TODO, this would be an async response...)
			return cb();
		});
	};

	/*----------  utils  ----------*/
	function validFrameIndex(self){

		for(var i=0; i < self._dataframes.length; i++){
			if(self._dataframes[i].parameterStateValid()) return i;
		}

		return -1;
	}


	/*----------  Expose  ----------*/
	
	cacheFactory.Cache = Cache;
	
})(
	_private('cache.factory'),
	_private('datapath.config'),
	_private('datapath'),
	_private('state.parameter')
);
(function(cacheFactory){
	function Data(Datapath, rawData){

		//apply fillers and formatters
		applyFormatter(Datapath, rawData);
		applyFiller(Datapath, rawData);

		//extend an array-like object to provide interface into the data
		var collection = Object.create( Array.prototype );
		collection = (Array.apply( collection, rawData ) || collection);

		var transformData = initTransforms(Datapath, rawData),
				subsetData = initSubsets(Datapath, rawData);

		collection.subset = function(subsetKey){
			return subsetData[subsetKey];
		};

		collection.transform = function(transformKey){
			return transformData[transformKey];
		};

		return collection;
	}

	/*----------  static methods  ----------*/
	Data.injectClassMethods = function( collection ){

      // Loop over all the prototype methods and add them
      // to the new collection.
      for (var method in Data.prototype){

          // Make sure this is a local method.
          if (Data.prototype.hasOwnProperty( method )){

              // Add the method to the collection.
              collection[ method ] = Data.prototype[ method ];

          }

      }

      // Return the updated collection.
      return( collection );

  };

  /*----------  class methods  ----------*/
  

	/*----------  utils  ----------*/

	function initTransforms(Datapath, rawData){
		var r = {};

		Datapath.getTransform().forEach(function(transformInstance){
			r[transformInstance.getKey()] = transformInstance.run(rawData);
		});

		return r;
	}

	function initSubsets(Datapath, rawData){
		var r = {};

		Datapath.getSubset().forEach(function(subsetInstance){
			r[subsetInstance.getKey()] = subsetInstance.run(rawData);
		});

		return r;
	}

	//in place formatting
	function applyFormatter(Datapath, data){
		if(Datapath.getFormatter() === undefined) return;

		Datapath.getFormatter().run(data);
	}

	//in place filling
	function applyFiller(Datapath, data){
		if(Datapath.getFiller().length === 0) return;
		Datapath.getFiller().forEach(function(fillerInstance){
			fillerInstance.run(data);
		});
	}


	cacheFactory.Data = Data;

})(
	_private('cache.factory')
);
(function(cacheFactory, parameterAPI, is){
	//the data frame is an association between a dataset and a parameter set
	function DataFrame(datapath){
		this._datapath = datapath;

		//the datapath (needs to be injected with data)
		this.data = new cacheFactory.Data(datapath, []);

		//param map (what state is this data frame relative to)
		this._param = {};
		this._paramKeys = datapath._.route.getParameterKeys();

		init(this);
	}

	DataFrame.prototype.fill = function(cb){
		//if we need to fill, take the async action, if not, immediately respond

		//get the data
		//--- --- ---
		//then inject into Data
		this.data = new cacheFactory.Data(this._datapath, ['this', 'is', 'the', 'dataset']);

		cb();
	};
	//do the parameter values associated with this frame reflect the current param state
	DataFrame.prototype.parameterStateValid = function(){
		//go through each of our parameter keys and ensure that each value associated
		//with this frame is consistent to the current set parameters
		for(var i = 0; i < this._paramKeys.length; i++){
			var paramKey = this._paramKeys[i];

			var p0 = this._param[paramKey];
			var p1 = parameterAPI.getParameter(paramKey);

			if(paramsEqual(p0, p1) === false) return false;
		}

		return true;
	};

	function init(self){
		//grab the most recent param state. That is what this frame will anchor to.
		self._paramKeys.forEach(function(paramKey){
			self._param[paramKey] = parameterAPI.getParameter(paramKey);
		});
	}
	

	//this needs to be tested
	function paramsEqual(p0, p1){
		//---- date cases ----//
		//inconsistent types
		if(is.Date(p0) && !is.Date(p1) || !is.Date(p0) && is.Date(p1)) return false;
		//both dates, and times are not equal
		else if(is.Date(p0) && is.Date(p1) && (p1.getTime !== p2.getTime())) return false;
		//---- string cases ----//
		//---- boolean cases ----//
		//TODO:remaining cases?

		//---- catch remaining cases with strict equality ----// (TODO:test)		
		else if(p0 === p1) return true;
		//everything must be ok.
		else return false;
	}

	cacheFactory.DataFrame = DataFrame;
	
})(
	_private('cache.factory'),
	_private('state.parameter'),
	_private('util.is')
);
(function(cacheAPI, publicAPI, cacheFactories, datapath, is, set){
		
		var dataCaches = {};

		publicAPI.ensureSynced = function(datapathKeys, cb){
			if(arguments.length === 0) return;
			else if(arguments.length > 1)datapathKeys = set.argsToArray(arguments);
			else if(!is.Array(datapathKeys)) datapathKeys = [datapathKeys];

			//narrow the requested keys to valid keys
			datapathKeys = filterValidKeys(datapathKeys);

			//ensure that caches exist for each of these keys
			ensureCachesExist(datapathKeys);

			//call sync for each of the caches
			callSync(datapathKeys, cb);

		};

		//do not expose the data frame api to the public
		//only return the data api attached to each frame
		publicAPI.getData = function(datakey){
			if(dataCaches[datakey] === undefined)return undefined; //maybe just a blank data object?
			else if(dataCaches[datakey].activeDataFrame() == undefined) return undefined;
			else return dataCaches[datakey].activeDataFrame().data;
		};

		publicAPI.syncAll = function(){

		};

		cacheAPI.getCache = function(datapathKey){
			return dataCaches[datapathKey];
		};

		/*----------  utils  ----------*/

		//ensure we have caches for some array of datapath keys
		function ensureCachesExist(datapathKeys){
			for(var i = 0; i < datapathKeys.length; i++){
				if(dataCaches[datapathKeys[i]] === undefined){
					dataCaches[datapathKeys[i]] = new cacheFactories.Cache(datapathKeys[i]);
				}
			}
		}

		//this function will analyze an array of keys, and return a set of valid keys
		function filterValidKeys(datapathKeys){
			return datapathKeys.filter(function(e){ return (datapath.getDatapath(e) !== undefined); });
		}

		//call syncs
		function callSync(datapathKeys, cb){
			var ajaxCallsRemaining = datapathKeys.length;
			for(var i = 0; i < datapathKeys.length; i++){
				dataCaches[datapathKeys[i]].sync(function(){
					ajaxCallsRemaining--;

					//if there are no outstanding requests, return the cb
					if(ajaxCallsRemaining === 0){
						if(is.Function(cb)) cb();
					}
				});
			}
		}

		
})(
	_private('cache'),
	_public(),
	_private('cache.factory'),
	_private('datapath'),
	_private('util.is'),
	_private('util.set')
);
(function(datapathFactories, fillerFactories, formatterFactories, subsetFactories, transformFactories, config, is, set, info){

	function Datapath(key, routeTemplate, configuration){

		this._ = {};//protected instance namespace
		this._.key = key;

		//virtual route
		this._.route = (new datapathFactories.VirtualRoute(routeTemplate || ''));
		this._.schemaKey = null;

		//pipeline memory
		this._.pipeline = {
			formatter:null,
			filler:[],
			subset:{},
			transform:{}
		};

	}

	Datapath.prototype.setRoute = function(routeTemplate){

		if(is.String(routeTemplate) === false){
			info.warn('setRoute requires a string as an argument. Ignoring this request. Behavior is undefined.');
			return this;
		}

		this._.route = (new datapathFactories.VirtualRoute(routeTemplate));

		return this;

	};

	//just track the key... Do not worry about resolving it.
	//if we resolved the key here, that would introduce ordering
	//dependencies on the programmer digesting the api.
	Datapath.prototype.useSchema = function(schemaKey){

		if(is.String(schemaKey) === false){
			info.warn('useSchema requires a string as an argument. Ignoring this request. Behavior is undefined.');
			return this;
		}

		this._.schemaKey = schemaKey;

		return this;
	}
	/*----------  Formatter Operations  ----------*/
	Datapath.prototype.getFormatter = function(){
		return this._.pipeline.formatter;
	};

	Datapath.prototype.hasFormatter = function(){
		return (this._.pipeline.formatter !== null);
	};

	Datapath.prototype.addFormatter = function(fn){

		//Are there any arguments?
		if(fn === undefined){
			info.warn("Calling [Datapath].addFormatter with no arguments. No action was taken.");

			return this;
		}
		//has the user provided a function as an argument to this function?
		else if(is.Function(fn) === false){
			info.warn("Calling [Datapath].addFormatter an argument other than a function. No action was taken.");

			return this;
		}
		//is the user attempting to overwrite a previously defined formatter on this datapath?
		else if(this.hasFormatter()){
			info.warn("Calling [Datapath].addFormatter caused Datasync to overwrite a formatter. Action was taken.");
		}

		//take the action
		this._.pipeline.formatter = (new formatterFactories.Formatter(fn));

		return this;
	};

	/*----------  Filler Operations  ----------*/
	Datapath.prototype.getFiller = function(){
		return this._.pipeline.filler;
	};
	
	Datapath.prototype.hasFiller = function(){
		return (this._.pipeline.filler.length !== 0);
	};

	Datapath.prototype.addFiller = function(fn){
		//Are there any arguments?
		if(fn === undefined){
			info.warn("Calling [Datapath].addFiller with no arguments. No action was taken.");

			return this;
		}
		//has the user provided a function as an argument to this function?
		else if(is.Function(fn) === false){
			info.warn("Calling [Datapath].addFiller an argument other than a function. No action was taken.");

			return this;
		}

		//2] take the action
		this._.pipeline.filler.push((new fillerFactories.Filler(fn)));

		return this;
	};


	/*----------  Subset Operations  ----------*/
	
	//multi level add API

	function addSubset_ml(self, name){
		return function(fn){
			return addSubset(self, name, fn);
		};
	}

	//single level add API (Used by multilevel)
	function addSubset(self, name, fn){
		//defend input
		if(is.String(name) === false){
			info.warn('Attempting to add a subset with an identifier that is not a string. The request was ignored. Operation will not be as expected.');
			return self;
		}
		else if(is.Function(fn) === false){
			info.warn('Attempting to add a subset['+name+'] with an invalid predicate. Expecting a predicate of type [Function]');
			return self;
		}
		//is this overwriting another subset? (non breaking)
		else if(self._.pipeline.subset[name] !== undefined){
			info.warn('Providing multiple definitions for subset ['+name+']. Took the action.');
		}

		//take action
		self._.pipeline.subset[name] = (new subsetFactories.Subset(name, fn));

		return self;
	}

	//add public facing interface
	Datapath.prototype.getSubset = function(key){
		if(key === undefined) return set.values(this._.pipeline.subset);
		else return this._.pipeline.subset[key];
	};

	Datapath.prototype.addSubset = function(subsetName, fn){

		//do we have valid input?
		if(subsetName === undefined){
			info.warn("Calling [Datapath].addSubset with no arguments. No action was taken.");
			return this;
		}
		//are we using single level accessor?
		else if(fn !== undefined)
			return addSubset(this, subsetName, fn);
		//they must want a multi-level accessor
		else
			return addSubset_ml(this, subsetName);

	};

	/*----------  Transform Operation  ----------*/

	function addTransform_ml(self, name){
		return function(fn){
			return addTransform(self, name, fn);
		};
	}

	//single level add API (Used by multilevel)
	function addTransform(self, name, fn){
		
		//is name valid?
		if(is.String(name) === false){
			info.warn('Attempting to add a transform with an identifier that is not a string. The request was ignored. Operation will not be as expected.');
			return self;
		}
		//is fn valid?
		else if(is.Function(fn) === false){
			info.warn('Attempting to add a transform['+name+'] with an invalid transform. Expecting a transform of type [Function]. The request was ignored. Operation will not be as expected.');
			return self;
		}
		//is this overwriting another transform? (non breaking)
		else if(self._.pipeline.transform[name] !== undefined){
			info.warn('Providing multiple definitions for transform ['+name+']. Took the action.');
		}

		//take action
		self._.pipeline.transform[name] = (new transformFactories.Transform(name, fn));

		return self;
	}

	//add public facing interface
	Datapath.prototype.addTransform = function(name, fn){

		//do we have valid input?
		if(name === undefined){
			info.warn("Calling [Datapath].addTransform with no arguments. No action was taken.");
			return this;
		}
		//are we using single level accessor?
		else if(fn !== undefined)
			return addTransform(this, name, fn);
		//they must want a multi-level accessor
		else
			return addTransform_ml(this, name);

	};

	Datapath.prototype.getTransform = function(key){
		if(key === undefined) return set.values(this._.pipeline.transform);
		else return this._.pipeline.transform[key];
	};


	/*----------  Configure hooks  ----------*/
	Datapath.prototype.setCacheSize = function(size){
		config.cacheSize.set(this._.key, size);
		
		return this;
	};

	/*----------  utilities  ----------*/
	
	//alias this class in factories
	datapathFactories.Datapath = Datapath;

})(
	_private('datapath.factory'), 

	_private('datapath.pipeline.filler.factory'), 
	_private('datapath.pipeline.formatter.factory'),
	_private('datapath.pipeline.subset.factory'),
	_private('datapath.pipeline.transform.factory'),  
	
	_private('datapath.config'),

	_private('util.is'),
	_private('util.set'),
	_private('info')
);

(function(datapathFactories, info, is, set, undefined){

	function VirtualRoute(route){
		//internal memory
		this._ = {
			route:route,

			paramIndex:{},
			routeConstructor:[]
		};

		//init the component
		generateRouteStructure(this, route);
	}
	VirtualRoute.prototype.getParameterKeys = function(){
		return Object.keys(this._.paramIndex);
	};

	VirtualRoute.prototype.generateURL = function(paramMap){
		//clone the route template
		var rRoute = this._.routeConstructor.slice(0);

		//cycle the provided param map and fill in the rRoute
		for(var paramKey in paramMap){
			//do not worry about params provided that are not relevant to route
			var indexes = this._.paramIndex[paramKey]
			if(indexes === undefined)continue;

			var paramValue = paramMap[paramKey];
			for(var i=0; i < indexes.length; i++){
				rRoute[indexes[i]] = formatDataForURL(paramValue);
			}
		}

		//join the constructed path
		return rRoute.join('');
	}

	/*----------  utilities  ----------*/
	function formatDataForURL(datum){
		return datum;
	}

	//params are now flat no distinction between query and route params
	function generateRouteStructure(self, route){
		var params = route.match(/:[\w\d]+/g),
				paramIndex = {},
				routeStructure = route.split(/:[\w\d]+/g);

		//generate a parameter map if there are params found
		if(params){
			var i = 1, p;
			while(p = params.shift()){
				//remove the colon
				p = p.slice(1);

				//insert an empty sting placeholder for the param
				routeStructure.splice(i, 0,'');

				//ensure the param map is an array
				paramIndex[p] = paramIndex[p] || [];

				//push the index into the paramMap
				paramIndex[p].push(i);

				//increment our count
				i+=2;
			}
		}

		//expose results
		self._.paramIndex = paramIndex;
		self._.routeConstructor = routeStructure;
	}
	

	//alias this class in factories
	datapathFactories.VirtualRoute = VirtualRoute;

})(
	_private('datapath.factory'), 
	_private('info'),
	_private('util.is'),
	_private('util.set')
);

(function(configApi, defaults, is, infoLog){
	//map datapaths to cache sizes
	var cacheSize = {};

	//create an api into map
	var api = {};

	api.get = function(datapath){

		//defend input
		if(datapath === undefined || is.String(datapath) === false){
			infoLog.error("Not providing a {string} datapath for [getCacheSize]. Action Ignored.");
			return;
		}

		//check if we have a cache size in this configuration
		if(cacheSize[datapath] !== undefined){
			return cacheSize[datapath];
		}
		//just use the global configuration
		else{
			return defaults.cacheSize;
		}
	};

	api.set = function(datapath, size, omitEvents){
		//defend input
		if(datapath === undefined || is.String(datapath) === false){
			infoLog.error("Not providing datapath for [setCacheSize]. Action Ignored.");
			return;
		}
		else if(size === undefined || is.Number(size) === false){
			infoLog.error("Not providing a {number} size for [setCacheSize]. Action Ignored.");
			return;
		}


		//we have changed the local cache size configuration, we can emit events if we choose.
		if(!omitEvents && (cacheSize[datapath] === undefined || cacheSize[datapath] !== size))
		{

		}

		//change the configuration
		cacheSize[datapath] = size;
	};

	//expose the api to the namespace
	configApi.cacheSize = api;
})(
	_private('datapath.config'),
	_private('datapath.configDefault'),
	_private('util.is'),
	_private('info')
);

(function(defaults){

	//the number of <paramset>:<dataset> pairs to store before flagging cached data for garbage collection
	defaults.cacheSize = 1;

})(
	_private('datapath.configDefault')
);

(function(publicApi, datapathAPI, is,set, datapathFactories, info, undefined){

	var datapathMap = {};
	
	publicApi.addDatapath = function(pathKey, pathTemplate){
		
		//defend input (must have at least a path key to complete action)
		if(pathKey === undefined || is.String(pathKey) === false){
			info.error('addDatapath Requries that at least a path key is provided. No recovery.');
			return;
		}
		else if(pathTemplate !== undefined && is.String(pathTemplate) === false){
			info.error('addDatapath Requries that the provided pathTemplate is a string. No recovery.');
			return;
		}
		//atempting to make multiple definitions with same key
		else if(datapathMap[pathKey] !== undefined){
			info.warn('Provided multiple definitions for datapath key ['+pathKey+']. Behavior is not predictable.');
		}

		return (datapathMap[pathKey] = new datapathFactories.Datapath(pathKey, pathTemplate));
	};

	publicApi.getDatapath = function(key){
		if(key === undefined)return set.values(datapathMap);
		else return datapathMap[key];
	};


	//private exposure
	datapathAPI.getDatapath = function(key){
		if(key === undefined)return set.values(datapathMap);
		else return datapathMap[key];
	};	


})(
	_public(), 
	_private('datapath'),
	_private('util.is'),
	_private('util.set'),
	_private('datapath.factory'),
	_private('info')
);

(function(fillerFactories, publicApi){

	//the filler currently just passes the entire dataset to a user provided function
	//that will append items to the dataset required (like filling in unseen dates)
	//would probably be better to make this assertion based...
	function Filler(fn){
		//defend input
		
		this.getFn = function(){
			return fn;
		};

	}

	Filler.prototype.run = function(dataset){
		this.getFn()(dataset);
	};

	//alias this class in factories
	fillerFactories.Filler = Filler;

})(
	_private('datapath.pipeline.filler.factory'), 
	_private(), 
	_public()
);
(function(formatterFactories, internalApi, publicApi){
	
	//formatter just passes entities
	function Formatter(fn){
		//defend input

		this.getFn = function(){
			return fn;
		};
	}

	Formatter.prototype.run = function(dataset){
		var formatter = this.getFn();

		dataset.forEach(function(datum){
			formatter(datum);
		});
	};

	//alias this class in factories
	formatterFactories.Formatter = Formatter;

})(_private('datapath.pipeline.formatter.factory'), _private(), _public());
(function(subsetFactories, publicApi){
	//the subset currently passes each item into a predicate (fn)
	//it then returns a filtered array
	function Subset(key, fn){
		//defend input

		this.getKey = function(){
			return key;
		};

		this.getFn = function(){
			return fn;
		};
	}

	Subset.prototype.run = function(data){
		return data.filter(this.getFn());
	};

	//alias this class in factories
	subsetFactories.Subset = Subset;

})(
	_private('datapath.pipeline.subset.factory'), 
	_public()
);
(function(transformFactories, publicApi){

	//the transform currently passes the entire formatted and filled dataset
	//into some transform function.

	function Transform(key, fn){

		this.getKey = function(){
			return key;
		};

		this.getFn = function(){
			return fn;
		};
		
	}

	Transform.prototype.run = function(data){
		return this.getFn()(data);
	};

	//alias this class in factories
	transformFactories.Transform = Transform;

})(
	_private('datapath.pipeline.transform.factory'), 
	_public()
);
(function(info, logOptions, is, undefined){


	info.warn = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.warn( logOptions.logPrefix + '  ' + message );
	};

	info.error = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.error( logOptions.logPrefix + '  ' + message );
	};

	info.log = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.log( logOptions.logPrefix + '  ' + message );
	};

	function canSendLog(message){
		//Check if we have logging enabled
		if(logOptions.logEnabled === false) return false;
		//check to see if this is a valid message
		else if(!is.String(message)) return false;
		else return true;
	}

})(
	_private('info'),
	_private('info.option'), 
	_private('util.is')
);
(function(logOption){

	logOption.logPrefix = 'Datasync::';
	logOption.logEnabled = true;
	
})(_private('info.option'));
(function(privateAPI){

	//constant map
	privateAPI.dataUpdated = 'datasyc::dataUpdated';

})(
	_private('on.constants')
);
(function(publicAPI, privateAPI, onConstants, info, is){

	//initialize the event map to be keyed on constants
	var eventMap = {};

	//public setter api
	publicAPI.on = function(key, cb){
		console.log(onConstants);
		//ensure that this key exists in our constants
		if(key === undefined || is.String(key) === false){
			info.warn("Attempting use an invalid event key. Ignoring.");
			return;
		}
		//ensure that we have a proper callback
		else if(cb === undefined || is.Function(cb) === false){
			info.warn('Provided an invalid argument for callback. Requesting function. Ingnoring.');
			return;
		}

		//ensure that an array exists for this key
		if(eventMap[key] === undefined){
			eventMap[key] = [];
		}

		//push the listener into the array
		eventMap[key].push(cb);
	};

	//private getter function to retrieve collected listeners
	privateAPI.getEventListeners = function(key){
		if(eventMap[key] === undefined) return [];
		else return eventMap[key];
	};

})(
	_public(),
	_private('on'),
	_private('on.constants'),
	_private('info'),
	_private('util.is')
);
(function(paramAPI, publicAPI){
	
	var parameterMap = {};

	//public api only sees associated state (not actual Parameter objects)
	publicAPI.setParameter = function(key, value){
		parameterMap[key] = value;
	};

	publicAPI.getParameter = paramAPI.getParameter = function(key){
		return parameterMap[key];
	};

})(
	_private('state.parameter'),
	_public()
);

(function(schemaFactory, info, is){
	function Schema(key, config){
		//private collections
		this._ = {
			//the key assigned to this schema
			key:key,

			//a store of the provided configuration
			templateDefinition:null,
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
		this._.templateDefinition = templateDefinition;
		this._.template = (new schemaFactory.SchemaTemplate(templateDefinition));

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

	schemaFactory.Schema = Schema;

})(
	_private('schema.factory'),
	_private('info'),
	_private('util.is')
);
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
(function(schemaFactories, typeCode, is){
	
	function STN_Collection(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);
		
	}

	/*----------  inherit properties from super class  ----------*/
	STN_Collection.prototype = Object.create(schemaFactories.SchemaTemplateNode.prototype);
	STN_Collection.prototype.constructor = STN_Collection;


	schemaFactories.STN_Collection = STN_Collection;

})(
	_private('schema.factory'),
	_private('util.is')
);
(function(schemaFactories, typeCode, is){
	
	function STN_Primitive(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	STN_Primitive.prototype = Object.create(schemaFactories.SchemaTemplateNode.prototype);
	STN_Primitive.prototype.constructor = STN_Primitive;
	
	schemaFactories.STN_Primitive = STN_Primitive;

})(
	_private('schema.factory'),
	_private('util.is')
);
(function(schemaFactories, typeCode, is){
	
	function STN_Schema(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	STN_Schema.prototype = Object.create(schemaFactories.SchemaTemplateNode.prototype);
	STN_Schema.prototype.constructor = STN_Schema;

	
	schemaFactories.STN_Schema = STN_Schema;

})(
	_private('schema.factory'),
	_private('util.is')
);
(function(typeCode){
	typeCode.primitive = 0;
	typeCode.primitiveConfig = 1;
	typeCode.collection = 2;
	typeCode.schema = 3;
})
(
	_private('schema.constant.typeCode')
);
(function(publicApi, schemaAPI, is,set, schemaFactories, info, undefined){

	var schemaMap = {};

	//public exposure
	publicApi.addSchema = function(schemaKey, schemaDefinition){
		//defend input (must have at least a path key to complete action)
		if(schemaKey === undefined || is.String(schemaKey) === false){
			info.error('addSchema Requries that at least a schemaKey[String] is provided. No recovery.');
			return;
		}
		else if(schemaDefinition !== undefined && is.Object(schemaDefinition) === false){
			info.error('addSchema Requries that the provided schemaDefinition is an object. No recovery.');
			return;
		}
		else if(schemaMap[schemaKey] !== undefined){
			info.warn('Provided multiple definitions for schama key ['+schemaKey+']. Behavior is not predictable.');
		}

		return (schemaMap[schemaKey] = new schemaFactories.Schema(schemaKey, schemaDefinition));
	};

	publicApi.getSchema = function(key){
		if(key === undefined)return set.values(schemaMap);
		else return schemaMap[key];
	};


	//private exposure
	schemaAPI.getSchema = function(key){
		if(key === undefined)return set.values(schemaMap);
		else return schemaMap[key];
	};	


})(
	_public(), 
	_private('schema'),
	_private('util.is'),
	_private('util.set'),
	_private('schema.factory'),
	_private('info')
);


/**
 * Credit for this integrated aja.js api goes to:
 * Bertrand Chevrier <chevrier.bertrand@gmail.com>
 */

(function(utilAPI){
    'use strict';

    /**
     * supported request types.
     * TODO support new types : 'style', 'file'?
     */
    var types = ['html', 'json', 'jsonp', 'script'];

    /**
     * supported http methods
     */
    var methods = [
        'connect',
        'delete',
        'get',
        'head',
        'options',
        'patch',
        'post',
        'put',
        'trace'
    ];

    /**
     * API entry point.
     * It creates an new {@link Aja} object.
     *
     * @example aja().url('page.html').into('#selector').go();
     *
     * @exports aja
     * @namespace aja
     * @returns {Aja} the {@link Aja} object ready to create your request.
     */
    var aja = function aja(){

        //contains all the values from the setter for this context.
        var data = {};

        //contains the bound events.
        var events = {};

        /**
         * The Aja object is your context, it provides your getter/setter
         * as well as methods the fluent way.
         * @typedef {Object} Aja
         */

        /**
         * @type {Aja}
         * @lends aja
         */
        var Aja = {

            /**
             * URL getter/setter: where your request goes.
             * All URL formats are supported: <pre>[protocol:][//][user[:passwd]@][host.tld]/path[?query][#hash]</pre>.
             *
             * @example aja().url('bestlib?pattern=aja');
             *
             * @throws TypeError
             * @param {String} [url] - the url to set
             * @returns {Aja|String} chains or get the URL
             */
            url : function(url){
                return _chain.call(this, 'url', url, validators.string);
            },

            /**
             * Is the request synchronous (async by default) ?
             *
             * @example aja().sync(true);
             *
             * @param {Boolean|*} [sync] - true means sync (other types than booleans are casted)
             * @returns {Aja|Boolean} chains or get the sync value
             */
            sync : function(sync){
                return _chain.call(this, 'sync', sync, validators.bool);
            },

            /**
             * Should we force to disable browser caching (true by default) ?
             * By setting this to false, then a buster will be added to the requests.
             *
             * @example aja().cache(false);
             *
             * @param {Boolean|*} [cache] - false means no cache  (other types than booleans are casted)
             * @returns {Aja|Boolean} chains or get cache value
             */
            cache : function(cache){
                return _chain.call(this, 'cache', cache, validators.bool);
            },

            /**
             * Type getter/setter: one of the predefined request type.
             * The supported types are : <pre>['html', 'json', 'jsonp', 'script', 'style']</pre>.
             * If not set, the default type is deduced regarding the context, but goes to json otherwise.
             *
             * @example aja().type('json');
             *
             * @throws TypeError if an unknown type is set
             * @param {String} [type] - the type to set
             * @returns {Aja|String} chains or get the type
             */
            type : function(type){
                return _chain.call(this, 'type', type, validators.type);
            },

            /**
             * HTTP Request Header getter/setter.
             *
             * @example aja().header('Content-Type', 'application/json');
             *
             * @throws TypeError
             * @param {String} name - the name of the header to get/set
             * @param {String} [value] - the value of the header to set
             * @returns {Aja|String} chains or get the header from the given name
             */
            header : function(name, value){
                data.headers = data.headers || {};

                validators.string(name);
                if(typeof value !== 'undefined'){
                    validators.string(value);

                    data.headers[name] = value;

                    return this;
                }

                return data.headers[name];
            },

            /**
             * <strong>Setter only</strong> to add authentication credentials to the request.
             *
             * @throws TypeError
             * @param {String} user - the user name
             * @param {String} passwd - the password value
             * @returns {Aja} chains
             */
            auth : function(user, passwd){
                //setter only

                validators.string(user);
                validators.string(passwd);
                data.auth = {
                    user : user,
                    passwd : passwd
                };

                return this;
            },

            /**
             * Sets a timeout (expressed in ms) after which it will halt the request and the 'timeout' event will be fired.
             *
             * @example aja().timeout(1000); // Terminate the request and fire the 'timeout' event after 1s
             *
             * @throws TypeError
             * @param {Number} [ms] - timeout in ms to set. It has to be an integer > 0.
             * @returns {Aja|String} chains or get the params
             */
            timeout : function(ms){
                return _chain.call(this, 'timeout', ms, validators.positiveInteger);
            },

            /**
             * HTTP method getter/setter.
             *
             * @example aja().method('post');
             *
             * @throws TypeError if an unknown method is set
             * @param {String} [method] - the method to set
             * @returns {Aja|String} chains or get the method
             */
            method : function(method){
                return _chain.call(this, 'method', method, validators.method);
            },

            /**
             * URL's queryString getter/setter. The parameters are ALWAYS appended to the URL.
             *
             * @example aja().queryString({ user : '12' }); //  ?user=12
             *
             * @throws TypeError
             * @param {Object|String} [params] - key/values POJO or URL queryString directly to set
             * @returns {Aja|String} chains or get the params
             */
            queryString : function(params){
                return _chain.call(this, 'queryString', params, validators.queryString);
            },

            /**
             * URL's queryString getter/setter.
             * Regarding the HTTP method the data goes to the queryString or the body.
             *
             * @example aja().data({ user : '12' });
             *
             * @throws TypeError
             * @param {Object} [params] - key/values POJO to set
             * @returns {Aja|String} chains or get the params
             */
            data : function(params){
                return _chain.call(this, 'data', params, validators.plainObject);
            },

            /**
             * Request Body getter/setter.
             * Objects and arrays are stringified (except FormData instances)
             *
             * @example aja().body(new FormData());
             *
             * @throws TypeError
             * @param {String|Object|Array|Boolean|Number|FormData} [content] - the content value to set
             * @returns {Aja|String|FormData} chains or get the body content
             */
            body : function(content){
                return _chain.call(this, 'body', content, null, function(content){
                    if(typeof content === 'object'){
                        //support FormData to be sent direclty
                        if( !(content instanceof FormData)){
                            //otherwise encode the object/array to a string
                            try {
                                content = JSON.stringify(content);
                            } catch(e){
                                throw new TypeError('Unable to stringify body\'s content : ' + e.name);
                            }
                            this.header('Content-Type', 'application/json');
                        }
                    } else {
                        content = content + ''; //cast
                    }
                    return content;
                });
            },

            /**
             * Into selector getter/setter. When you want an Element to contain the response.
             *
             * @example aja().into('div > .container');
             *
             * @throws TypeError
             * @param {String|HTMLElement} [selector] - the dom query selector or directly the Element
             * @returns {Aja|Array} chains or get the list of found elements
             */
            into : function(selector){
                return _chain.call(this, 'into', selector, validators.selector, function(selector){
                    if(typeof selector === 'string'){
                        return document.querySelectorAll(selector);
                    }
                    if(selector instanceof HTMLElement){
                        return [selector];
                    }
                });
            },

            /**
             * Padding name getter/setter, ie. the callback's PARAMETER name in your JSONP query.
             *
             * @example aja().jsonPaddingName('callback');
             *
             * @throws TypeError
             * @param {String} [paramName] - a valid parameter name
             * @returns {Aja|String} chains or get the parameter name
             */
            jsonPaddingName : function(paramName){
                return _chain.call(this, 'jsonPaddingName', paramName, validators.string);
            },

            /**
             * Padding value  getter/setter, ie. the callback's name in your JSONP query.
             *
             * @example aja().jsonPadding('someFunction');
             *
             * @throws TypeError
             * @param {String} [padding] - a valid function name
             * @returns {Aja|String} chains or get the padding name
             */
            jsonPadding : function(padding){
                return _chain.call(this, 'jsonPadding', padding, validators.func);
            },

            /**
             * Attach an handler to an event.
             * Calling `on` with the same eventName multiple times add callbacks: they
             * will all be executed.
             *
             * @example aja().on('success', function(res){ console.log('Cool', res);  });
             *
             * @param {String} name - the name of the event to listen
             * @param {Function} cb - the callback to run once the event is triggered
             * @returns {Aja} chains
             */
            on : function(name, cb){
                if(typeof cb === 'function'){
                    events[name] = events[name] || [];
                    events[name].push(cb);
                }
                return this;
            },

            /**
             * Remove ALL handlers for an event.
             *
             * @example aja().off('success');
             *
             * @param {String} name - the name of the event
             * @returns {Aja} chains
             */
            off : function(name){
                events[name] = [];
                return this;
            },

            /**
             * Trigger an event.
             * This method will be called hardly ever outside Aja itself,
             * but there is edge cases where it can be useful.
             *
             * @example aja().trigger('error', new Error('Emergency alert'));
             *
             * @param {String} name - the name of the event to trigger
             * @param {*} data - arguments given to the handlers
             * @returns {Aja} chains
             */
            trigger : function(name, data){
                var self = this;
                var eventCalls  = function eventCalls(name, data){
                    if(events[name] instanceof Array){
                        events[name].forEach(function(event){
                            event.call(self, data);
                        });
                    }
                };
                if(typeof name !== 'undefined'){
                    name = name + '';
                    var statusPattern = /^([0-9])([0-9x])([0-9x])$/i;
                    var triggerStatus = name.match(statusPattern);

                    //HTTP status pattern
                    if(triggerStatus && triggerStatus.length > 3){
                        Object.keys(events).forEach(function(eventName){
                            var listenerStatus = eventName.match(statusPattern);
                            if(listenerStatus && listenerStatus.length > 3 &&       //an listener on status
                                triggerStatus[1] === listenerStatus[1] &&           //hundreds match exactly
                                (listenerStatus[2] === 'x' ||  triggerStatus[2] === listenerStatus[2]) && //tens matches
                                (listenerStatus[3] === 'x' ||  triggerStatus[3] === listenerStatus[3])){ //ones matches

                                eventCalls(eventName, data);
                            }
                        });
                    //or exact matching
                    } else if(events[name]){
                        eventCalls(name, data);
                    }
                }
                return this;
            },

            /**
             * Trigger the call.
             * This is the end of your chain loop.
             *
             * @example aja()
             *           .url('data.json')
             *           .on('200', function(res){
             *               //Yeah !
             *            })
             *           .go();
             */
            go : function(){

                var type    = data.type || (data.into ? 'html' : 'json');
                var url     = _buildQuery();

                //delegates to ajaGo
                if(typeof ajaGo[type] === 'function'){
                    return ajaGo[type].call(this, url);
                }
            }
        };

        /**
         * Contains the different communication methods.
         * Used as provider by {@link Aja.go}
         *
         * @type {Object}
         * @private
         * @memberof aja
         */
        var ajaGo = {

            /**
             * XHR call to url to retrieve JSON
             * @param {String} url - the url
             */
            json : function(url){
                var self = this;

                ajaGo._xhr.call(this, url, function processRes(res){
                    if(res){
                        try {
                            res = JSON.parse(res);
                        } catch(e){
                            self.trigger('error', e);
                            return null;
                        }
                    }
                    return res;
                });
            },

            /**
             * XHR call to url to retrieve HTML and add it to a container if set.
             * @param {String} url - the url
             */
            html : function(url){
                ajaGo._xhr.call(this, url, function processRes(res){
                    if(data.into && data.into.length){
                        [].forEach.call(data.into, function(elt){
                            elt.innerHTML = res;
                        });
                    }
                    return res;
                });
            },

            /**
             * Create and send an XHR query.
             * @param {String} url - the url
             * @param {Function} processRes - to modify / process the response before sent to events.
             */
            _xhr : function(url, processRes){
                var self = this;

                //iterators
                var key, header;

                var method      = data.method || 'get';
                var async       = data.sync !== true;
                var request     = new XMLHttpRequest();
                var _data       = data.data;
                var body        = data.body;
                var contentType = this.header('Content-Type');
                var timeout     = data.timeout;
                var timeoutId;
                var isUrlEncoded;
                var openParams;

                //guess content type
                if(!contentType && _data && _dataInBody()){
                    this.header('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
                    contentType = this.header('Content-Type');
                }

                //if data is used in body, it needs some modifications regarding the content type
                if(_data && _dataInBody()){
                    if(typeof body !== 'string'){
                        body = '';
                    }

                    if(contentType.indexOf('json') > -1){
                        try {
                            body = JSON.stringify(_data);
                        } catch(e){
                            throw new TypeError('Unable to stringify body\'s content : ' + e.name);
                        }
                    } else {
                        isUrlEncoded = contentType && contentType.indexOf('x-www-form-urlencoded') > 1;
                        for(key in _data){
                            if(isUrlEncoded){
                                body += encodeURIComponent(key) + '=' + encodeURIComponent(_data[key]) + '&';
                            } else {
                                body += key + '=' + _data[key] + '\n\r';
                            }
                        }
                    }
                }

                //open the XHR request
                openParams = [method, url, async];
                if(data.auth){
                    openParams.push(data.auth.user);
                    openParams.push(data.auth.passwd);
                }
                request.open.apply(request, openParams);

                //set the headers
                for(header in data.headers){
                    request.setRequestHeader(header, data.headers[header]);
                }

                //bind events
                request.onprogress = function(e){
                    if (e.lengthComputable) {
                        self.trigger('progress', e.loaded / e.total);
                    }
                };

                request.onload = function onRequestLoad(){
                    var response = request.responseText;

                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    if(this.status >= 200 && this.status < 300){
                        if(typeof processRes === 'function'){
                            response = processRes(response);
                        }
                        self.trigger('success', response);
                    }

                    self.trigger(this.status, response);

                    self.trigger('end', response);
                };

                request.onerror = function onRequestError (err){
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    self.trigger('error', err, arguments);
                };

                //sets the timeout
                if (timeout) {
                    timeoutId = setTimeout(function() {
                        self.trigger('timeout', {
                            type: 'timeout',
                            expiredAfter: timeout
                        }, request, arguments);
                        request.abort();
                    }, timeout);
                }

                //send the request
                request.send(body);
            },

            /**
             * @this {Aja} call bound to the Aja context
             * @param {String} url - the url
             */
            jsonp : function(url){
                var script;
                var self            = this;
                var head            = document.querySelector('head');
                var async           = data.sync !== true;
                var jsonPaddingName = data.jsonPaddingName || 'callback';
                var jsonPadding     = data.jsonPadding || ('_padd' + new Date().getTime() + Math.floor(Math.random() * 10000));
                var paddingQuery    = {};

                if(aja[jsonPadding]){
                    throw new Error('Padding ' + jsonPadding + '  already exists. It must be unique.');
                }
                if(!/^ajajsonp_/.test(jsonPadding)){
                    jsonPadding = 'ajajsonp_' + jsonPadding;
                }

                //window.ajajsonp = window.ajajsonp || {};
                window[jsonPadding] = function padding (response){
                    self.trigger('success', response);
                    head.removeChild(script);
                    window[jsonPadding] = undefined;
                };

                paddingQuery[jsonPaddingName] = jsonPadding;

                url =  appendQueryString(url, paddingQuery);

                script = document.createElement('script');
                script.async = async;
                script.src = url;
                script.onerror = function(){
                    self.trigger('error', arguments);
                    head.removeChild(script);
                    window[jsonPadding] = undefined;
                };
                head.appendChild(script);
            },

            /**
             * Loads a script.
             *
             * This kind of ugly script loading is sometimes used by 3rd part libraries to load
             * a configured script. For example, to embed google analytics or a twitter button.
             *
             * @this {Aja} call bound to the Aja context
             * @param {String} url - the url
             */
            script : function(url){

                var self    = this;
                var head    = document.querySelector('head') || document.querySelector('body');
                var async   = data.sync !== true;
                var script;

                if(!head){
                    throw new Error('Ok, wait a second, you want to load a script, but you don\'t have at least a head or body tag...');
                }

                script = document.createElement('script');
                script.async = async;
                script.src = url;
                script.onerror = function onScriptError(){
                    self.trigger('error', arguments);
                    head.removeChild(script);
                };
                script.onload = function onScriptLoad(){
                    self.trigger('success', arguments);
                };

                head.appendChild(script);
            }
        };

        /**
         * Helps you to chain getter/setters.
         * @private
         * @memberof aja
         * @this {Aja} bound to the current context
         * @param {String} name - the property name
         * @param {*} [value] - the property value if we are in a setter
         * @param {Function} [validator] - to validate/transform the value if needed
         * @param {Function} [update] - when there is more to do with the setter
         * @returns {Aja|*} either the current context (setter) or the requested value (getter)
         * @throws TypeError
         */
        var _chain = function _chain(name, value, validator, update){
            if(typeof value !== 'undefined'){
                if(typeof validator === 'function'){
                    try{
                        value = validator.call(validators, value);
                    } catch(e){
                        throw new TypeError('Failed to set ' + name + ' : ' + e.message);
                    }
                }
                if(typeof update === 'function'){
                    data[name] = update.call(this, value);
                } else {
                    data[name] = value;
                }
                return this;
            }
            return data[name] === 'undefined' ? null : data[name];
        };

        /**
         * Check whether the data must be set in the body instead of the queryString
         * @private
         * @memberof aja
         * @returns {Boolean} true id data goes to the body
         */
        var _dataInBody = function _dataInBody(){
            return ['delete', 'patch', 'post', 'put'].indexOf(data.method) > -1;
        };

        /**
         * Build the URL to run the request against.
         * @private
         * @memberof aja
         * @returns {String} the URL
         */
        var _buildQuery = function _buildQuery(){

            var url         = data.url;
            var cache       = typeof data.cache !== 'undefined' ? !!data.cache : true;
            var queryString = data.queryString || '';
            var _data       = data.data;

            //add a cache buster
            if(cache === false){
                queryString += '&ajabuster=' + new Date().getTime();
            }

            url = appendQueryString(url, queryString);

            if(_data && !_dataInBody()){
                url =  appendQueryString(url, _data);
            }
            return url;
        };

        //expose the Aja function
        return Aja;
    };

    /**
     * Validation/reparation rules for Aja's getter/setter.
     */
    var validators = {

        /**
         * cast to boolean
         * @param {*} value
         * @returns {Boolean} casted value
         */
        bool : function(value){
            return !!value;
        },

        /**
         * Check whether the given parameter is a string
         * @param {String} string
         * @returns {String} value
         * @throws {TypeError} for non strings
         */
        string : function(string){
            if(typeof string !== 'string'){
                throw new TypeError('a string is expected, but ' + string + ' [' + (typeof string) + '] given');
            }
            return string;
        },

        /**
         * Check whether the given parameter is a positive integer > 0
         * @param {Number} integer
         * @returns {Number} value
         * @throws {TypeError} for non strings
         */
        positiveInteger : function(integer){
            if(parseInt(integer) !== integer || integer <= 0){
                throw new TypeError('an integer is expected, but ' + integer + ' [' + (typeof integer) + '] given');
            }
            return integer;
        },

        /**
         * Check whether the given parameter is a plain object (array and functions aren't accepted)
         * @param {Object} object
         * @returns {Object} object
         * @throws {TypeError} for non object
         */
        plainObject : function(object){
            if(typeof object !== 'object' || object.constructor !== Object){
                throw new TypeError('an object is expected, but ' + object + '  [' + (typeof object) + '] given');
            }
            return object;
        },

        /**
         * Check whether the given parameter is a type supported by Aja.
         * The list of supported types is set above, in the {@link types} variable.
         * @param {String} type
         * @returns {String} type
         * @throws {TypeError} if the type isn't supported
         */
        type : function(type){
            type = this.string(type);
            if(types.indexOf(type.toLowerCase()) < 0){
                throw new TypeError('a type in [' + types.join(', ') + '] is expected, but ' + type + ' given');
            }
            return type.toLowerCase();
        },

        /**
         * Check whether the given HTTP method is supported.
         * The list of supported methods is set above, in the {@link methods} variable.
         * @param {String} method
         * @returns {String} method (but to lower case)
         * @throws {TypeError} if the method isn't supported
         */
        method : function(method){
            method = this.string(method);
            if(methods.indexOf(method.toLowerCase()) < 0){
                throw new TypeError('a method in [' + methods.join(', ') + '] is expected, but ' + method + ' given');
            }
            return method.toLowerCase();
        },

        /**
         * Check the queryString, and create an object if a string is given.
         *
         * @param {String|Object} params
         * @returns {Object} key/value based queryString
         * @throws {TypeError} if wrong params type or if the string isn't parseable
         */
        queryString : function(params){
            var object = {};
            if(typeof params === 'string'){

                params.replace('?', '').split('&').forEach(function(kv){
                    var pair = kv.split('=');
                    if(pair.length === 2){
                        object[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                    }
                });
            } else {
                object = params;
            }
            return this.plainObject(object);
        },

        /**
         * Check if the parameter enables us to select a DOM Element.
         *
         * @param {String|HTMLElement} selector - CSS selector or the element ref
         * @returns {String|HTMLElement} same as input if valid
         * @throws {TypeError} check it's a string or an HTMLElement
         */
        selector : function(selector){
            if(typeof selector !== 'string' && !(selector instanceof HTMLElement)){
                throw new TypeError('a selector or an HTMLElement is expected, ' + selector + ' [' + (typeof selector) + '] given');
            }
            return selector;
        },

        /**
         * Check if the parameter is a valid JavaScript function name.
         *
         * @param {String} functionName
         * @returns {String} same as input if valid
         * @throws {TypeError} check it's a string and a valid name against the pattern inside.
         */
        func : function(functionName){
            functionName = this.string(functionName);
            if(!/^([a-zA-Z_])([a-zA-Z0-9_\-])+$/.test(functionName)){
                throw new TypeError('a valid function name is expected, ' + functionName + ' [' + (typeof functionName) + '] given');
            }
            return functionName;
        }
    };

    /**
     * Query string helper : append some parameters
     * @private
     * @param {String} url - the URL to append the parameters
     * @param {Object} params - key/value
     * @returns {String} the new URL
     */
    var appendQueryString = function appendQueryString(url, params){
        var key;
        url = url || '';
        if(params){
            if(url.indexOf('?') === -1){
                url += '?';
            }
            if(typeof params === 'string'){
                url += params;
            } else if (typeof params === 'object'){
                for(key in params){
                    if(!/[?&]$/.test(url)){
                        url += '&';
                    }
                    url += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }
            }
        }

        return url;
    };

    //append to the util API
    utilAPI.aja = aja;
}(
    _private('util')
));
(function(is){

	is.Integer = function(val) {
		return (isNumber(val) && Math.floor(val) == val);
	};

	is.Undefined = function(obj){
		return obj === void 0;
	};

	is.Number = function(val) {
		return (typeof val == "number");
	};

	is.String = function(obj){
		return (typeof obj == "string");
	};

	is.Boolean = function(obj) {
		return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
	};

	is.Object = function(obj) {
		var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
	};

	is.Array = function(val) {
		return (val instanceof Array);
	};

	is.Function = function(val) {
		return (typeof val == "function");
	};

	is.Date = function(val) {
		return (Object.prototype.toString.call(val) === "[object Date]");
	};

})(_private('util.is'));
(function(set){

	set.values = function(obj){
		var output = [];
		for (var key in obj) {
		    if (Object.prototype.hasOwnProperty.call(obj, key)) {
		        output.push(obj[key]);
		    }
		}

		return output;
	};

	set.argsToArray = function(argumentObject){
		var outputArray = [];

		for(var i = 0; i < argumentObject.length; i++){
			outputArray.push(argumentObject[i]);
		}

		return outputArray;
	};

})(_private('util.set'));

	window._public = publicAPI;
	window._private = privateAPI;
	
})({});