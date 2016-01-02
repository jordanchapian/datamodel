define('type/Type',[],
function(){
	
	function Type(config){

		this._.accessor = config.accessorAlias || {};
	}

	return Type;

});