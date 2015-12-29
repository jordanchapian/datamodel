define(['datamodel'],
function(datamodel){
	
	describe('Validation Feature',function(){

		describe('Primitive Patterns', function(){

			it('should validate dates', function(){
				var dm = datamodel().setTemplate(Date);

				expect(dm.validate("test")).toBeFalsy();
				expect(dm.validate(["test"])).toBeFalsy();
				expect(dm.validate(1)).toBeFalsy();
				expect(dm.validate(false)).toBeFalsy();
				expect(dm.validate(new Date())).toBeTruthy();

			});

			it('should validate strings', function(){
				var dm = datamodel().setTemplate(String);

				expect(dm.validate("test")).toBeTruthy();
				expect(dm.validate(["test"])).toBeFalsy();
				expect(dm.validate(1)).toBeFalsy();
				expect(dm.validate(false)).toBeFalsy();
				expect(dm.validate(new Date())).toBeFalsy();

			});

			it('should validate numbers', function(){
				var dm = datamodel().setTemplate(Number);

				expect(dm.validate("test")).toBeFalsy();
				expect(dm.validate(["test"])).toBeFalsy();
				expect(dm.validate(1)).toBeTruthy();
				expect(dm.validate(false)).toBeFalsy();
				expect(dm.validate(new Date())).toBeFalsy();

			});

			it('should validate booleans', function(){
				var dm = datamodel().setTemplate(Boolean);

				expect(dm.validate("test")).toBeFalsy();
				expect(dm.validate(["test"])).toBeFalsy();
				expect(dm.validate(1)).toBeFalsy();
				expect(dm.validate(false)).toBeTruthy();
				expect(dm.validate(new Date())).toBeFalsy();

			});

		});

		describe('Collection Pattern', function(){
			
		});
		
	});
});