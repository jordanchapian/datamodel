module.exports = function(grunt) {

  grunt.initConfig({
    
    jasmine : {
      functional:{
        src : './src/datamodel/**/*.js',
        options : {
            outfile:'./test/functionalTests.html',
            keepRunner:true,
            specs : './test/functional/**/*.spec.js',
            template: require('grunt-template-jasmine-requirejs'),
            templateOptions: {
                requireConfig: {
                    baseUrl: '../'
                }
            }
        }
      }
    },

    requirejs: {
      compile: {
        options: {
          optimize: "none",
          almond: true,
          out: "./build/datamodel.js",
          name: "../../node_modules/almond/almond",
          baseUrl: "./src/datamodel",
          include:['datamodel'],
          wrap: {
              startFile: "src/start.frag",
              endFile: "src/end.frag"
          }
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('default', ['requirejs']);
  grunt.registerTask('test', ['jasmine']);
  // grunt.registerTask('dev', ['watch']);
};