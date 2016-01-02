define('type/Type',[],
function(){
	
	function Type(config){
		this._ = {
			accessor : config.accessorAlias || function(){},
			isValid : config.isValid,
			name : config.name
		};

	}

	Type.prototype.getAccessor = function(){
		return this._.accessor;
	};

	Type.prototype.getName = function(){
		return this._.name;
	};

	return Type;

});