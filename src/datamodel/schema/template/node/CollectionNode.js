define('schema/template/node/CollectionNode',
[
	'schema/template/node/TemplateNode',
	'util/is'
],
function(TemplateNode, is){
	
	function CollectionNode(configuration, accessKey){
		//call super class constructor
		TemplateNode.apply(this, arguments);
	}

	/*----------  inherit properties from super class  ----------*/
	CollectionNode.prototype = Object.create(TemplateNode.prototype);
	CollectionNode.prototype.constructor = CollectionNode;

	CollectionNode.prototype.validate = function(datum){
		//datum must be an array
		if(is.Array(datum) === false) return false;
		//do we need to go further to validate each element?
		else if(this.getChildren().length === 1)
		{
			for(var i = 0; i < datum.length; i++){
				//bail if we have a single failed result
				if(this.getChildren()[0].validate(datum[i]) === false){
					return false;
				};
			}

			//if we passed all above validations, we are ok.
			return true;
		}	
		//validation complete if we do not have any additional specs...
		//if we do not specify what must be in the array, we do not care.
		else return true;
	};

	
	return CollectionNode;

});