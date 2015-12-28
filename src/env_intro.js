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