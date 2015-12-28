module.exports = function(grunt) {

  grunt.initConfig({

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

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('default', ['requirejs']);
  // grunt.registerTask('test', ['concat', 'jasmine']);
  // grunt.registerTask('dev', ['watch']);
};