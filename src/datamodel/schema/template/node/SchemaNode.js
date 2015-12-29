define('schema/template/node/SchemaNode',
[
	'./TemplateNode',
	'util/is'
],
function(TemplateNode, is){
	
	function SchemaNode(configuration, accessKey){
		//call super class constructor
		TemplateNode.apply(this, arguments);
		
		//property scratch pad
		this._.hasProperty = {};
		this._.nProperties = 0;
	}

	/*----------  inherit properties from super class  ----------*/
	SchemaNode.prototype = Object.create(TemplateNode.prototype);
	SchemaNode.prototype.constructor = SchemaNode;
	
	SchemaNode.prototype.addChild = function(node){
		TemplateNode.prototype.addChild.apply(this, [node]);

		this._.hasProperty[node._.accessKey] = true;
		this._.nProperties++;
	};

	SchemaNode.prototype.validate = function(datum){
		//are we dealing with data of type Object?
		if(is.Object(datum) === false) return false;
		
		//ensure that all keys on this object are those specified by the object
		var nValid = 0;
		for(var key in datum){
			if(datum[key] === false)return false;
			else nValid++;
		}

		//ensure that we have used all properties...
		if(this._.nProperties !== nValid) return false;

		//pass down to each child for further validation
		var childNodes = this.getChildren();
		for(var i = 0; i < childNodes.length; i++){
			//bail if we have a single failed result
			if(childNodes[i].validate(datum[childNodes[i].getAccessKey()]) === false){
				return false;
			};
		}

		return true;
	};
	
	return SchemaNode;

});