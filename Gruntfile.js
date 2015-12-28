module.exports = function(grunt) {

  grunt.initConfig({
    watch: {
      scripts: {
        files: ['src/**/*.js'],
        tasks: ['concat'],
        options: {
          spawn: false,
        },
      },
    },
    jasmine: {
      all: {
        src: 'build/datasync_test.js',
        options: {
          specs: 'src/**/*.spec.js'
        //   helpers: 'spec/*Helper.js'
        }
      }
    },
    concat: {
      globalBuild: {
        src: [
          './src/env_intro.js',
          //temporary order dependency TODO:Module loader
          './src/datasync/schema/SchemaTemplate/SchemaTemplateNode/SchemaTemplateNode.js',
          './src/datasync/**/*.js',
          './src/env_outro_global.js',

          '!./src/datasync/**/*.spec.js'
        ],
        dest: 'build/datasync_global.js'
      },
      isolateBuild:{
        src: [
          './src/env_intro.js',
          //temporary order dependency TODO:Module loader
          './src/datasync/schema/SchemaTemplate/SchemaTemplateNode/SchemaTemplateNode.js',
          './src/datasync/**/*.js',
          './src/env_outro_isolate.js',

          '!./src/datasync/**/*.spec.js'
        ],
        dest: 'build/datasync_isolate.js'
      },
      testBuild:{
        src: [
          './src/env_intro.js',
          //temporary order dependency TODO:Module loader
          './src/datasync/schema/SchemaTemplate/SchemaTemplateNode/SchemaTemplateNode.js',
          './src/datasync/**/*.js',
          './src/env_outro_test.js',

          '!./src/datasync/**/*.spec.js'
        ],
        dest: 'build/datasync_test.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  grunt.registerTask('default', ['concat']);
  grunt.registerTask('test', ['concat', 'jasmine']);
  grunt.registerTask('dev', ['watch']);
};