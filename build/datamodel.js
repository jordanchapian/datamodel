(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module 
        //in another project. That other project will only 
        //see this AMD call, not the internal modules in 
        //the closure below. 
        define([], factory);
    } else {
        //Browser globals case. Just assign the 
        //result to a property on the global. 
        root.datamodel = factory();
    }
}(this, function () {/**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../../node_modules/almond/almond", function(){});

define('util/is', [],
{
	Integer : function(val) {
		return (isNumber(val) && Math.floor(val) == val);
	},

	Undefined : function(obj){
		return obj === void 0;
	},

	Number : function(val) {
		return (typeof val == "number");
	},

	String : function(obj){
		return (typeof obj == "string");
	},

	Boolean : function(obj) {
		return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
	},

	Object : function(obj) {
		var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
	},

	Array : function(val) {
		return (val instanceof Array);
	},

	Function : function(val) {
		return (typeof val == "function");
	},

	Date : function(val) {
		return (Object.prototype.toString.call(val) === "[object Date]");
	}
});

define('util/set', [],
{
	values:function(obj){
		var output = [];
		for (var key in obj) {
		    if (Object.prototype.hasOwnProperty.call(obj, key)) {
		        output.push(obj[key]);
		    }
		}

		return output;
	},
	argsToArray:function(argumentObject){
		var outputArray = [];

		for(var i = 0; i < argumentObject.length; i++){
			outputArray.push(argumentObject[i]);
		}

		return outputArray;
	}
});
define('option/info',[],
{
	
	logPrefix : 'Datasync::',
	logEnabled : true
	
});
define('info',
['util/is', 'option/info'],
function(is, infoOptions){
	var info = {};

	info.warn = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.warn( infoOptions.logPrefix + '  ' + message );
	};

	info.error = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.error( infoOptions.logPrefix + '  ' + message );
	};

	info.log = function(message){
		if(!canSendLog(message))return;
		//carry through with request, appending prefix to message
		console.log( infoOptions.logPrefix + '  ' + message );
	};

	function canSendLog(message){
		//Check if we have logging enabled
		if(infoOptions.logEnabled === false) return false;
		//check to see if this is a valid message
		else if(!is.String(message)) return false;
		else return true;
	}

	return info;
});
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
define('schema/template/node/CollectionNode',
['schema/template/node/TemplateNode'],
function(TemplateNode){
	
	function CollectionNode(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	CollectionNode.prototype = Object.create(TemplateNode.prototype);
	CollectionNode.prototype.constructor = CollectionNode;

	
	return CollectionNode;

});
define('schema/template/node/PrimitiveNode',
['schema/template/node/TemplateNode'],
function(TemplateNode){
	
	function PrimitiveNode(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	PrimitiveNode.prototype = Object.create(TemplateNode.prototype);
	PrimitiveNode.prototype.constructor = PrimitiveNode;

	
	return PrimitiveNode;

});
define('schema/template/node/SchemaNode',
['schema/template/node/TemplateNode'],
function(TemplateNode){
	
	function SchemaNode(configuration, accessKey){
		//call super class constructor
		schemaFactories.SchemaTemplateNode.apply(this, arguments);

	}

	/*----------  inherit properties from super class  ----------*/
	SchemaNode.prototype = Object.create(TemplateNode.prototype);
	SchemaNode.prototype.constructor = SchemaNode;

	
	return SchemaNode;

});
define('util/schema',
[	
	'schema/template/node/CollectionNode',
	'schema/template/node/PrimitiveNode',
	'schema/template/node/SchemaNode',
	'util/is'
],
function(CollectionNode, PrimitiveNode, SchemaNode, is){

	var utils = {};
	var validPrimitives = [ String, Boolean, Date, Number ];

	utils.getNodeConstructor = function(config){
		if(utils.isPrimitive(config)) return PrimitiveNode;
		else if(utils.isCollection(config)) return CollectionNode;
		else if(utils.isSchema(config)) return SchemaNode;
		else return undefined;
	};

	utils.isPrimitive = function(config){
		//handle configuration object and basic function cases
		return ((is.Function(config) && validPrimitives.indexOf(config) != -1)
					 || (is.Object(config) && config._type !== undefined));
	};

	utils.isCollection = function(config){
		return (is.Array(config));
	};

	utils.isSchema = function(config){
		return (is.Object(config) && config._type === undefined);
	};

});
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



define('schema/schemaAPI',
['util/is', 'util/set', 'info', 'schema/Schema'],
function(is, set, info, Schema){
	var schemaMap = {};

	var api = {};
	//public exposure
	api.addSchema = function(schemaKey, schemaDefinition){
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

		return (schemaMap[schemaKey] = new Schema(schemaKey, schemaDefinition));
	};

	api.getSchema = function(key){
		if(key === undefined)return set.values(schemaMap);
		else return schemaMap[key];
	};

	return api;
});
define('datamodel',
[
	'schema/schemaAPI'
],
{});
	//above
    return require('schema/schemaAPI');
}));