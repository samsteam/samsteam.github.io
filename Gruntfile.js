module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: [ "dist/desktop-app" ],
    nodewebkit: {
      options: {
        version: '0.12.3',
        build_dir: './dist/desktop-app',
        // choose what platforms to compile for here
        mac: true,
        win: true,
        linux32: true,
        linux64: false
      },
      src: ['*','dist/**/*', 'templates/**/*', 'images/**/*']
    },
    concat:{
      options: {
        separator: ';'
      },
      deps:{
        src:[
          'node_modules/jquery/dist/jquery.js',
          'node_modules/angular/angular.js',
          'node_modules/bootstrap/dist/js/bootstrap.js',
          'deps/js/**/*.js'
        ],
        dest: 'dist/js/deps.js'
      }
    },
    browserify:{
      project:{
        src:[
          'js/**/*.js'
        ],
        dest:'dist/js/sams.js'
      }
    },
    cssmin: {
      project: {
        src: ['css/**/*.css'],
        dest: 'dist/css/sams.css',
      },
      deps: {
        src: ['deps/css/**/*.css'],
        dest: 'dist/css/deps.css'
      }
    },
    watch:{
      dependencesCSS:{
        files: ['<%= cssmin.deps.src %>'],
        tasks: ['cssmin:deps']
      },
      projectCSS:{
        files: ['<%= cssmin.project.src %>'],
        tasks: ['cssmin:project']
      },
      dependencesJS:{
        files: ['<%= concat.deps.src %>'],
        tasks: ['concat:deps']
      },
      projectJS:{
        files: ['<%= browserify.project.src %>'],
        tasks: ['browserify:project']
      },
    }
  });

  // Load the npm installed tasks
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // The default tasks to run when you type: grunt
  grunt.registerTask('default', ['concat', 'browserify', 'cssmin']);
  grunt.registerTask('nw-export', ['clean', 'concat', 'browserify', 'cssmin', 'nodewebkit']);

  grunt.registerTask('watches', [
    'watch:dependencesJS',
    'watch:dependencesCSS',
    'watch:projectJS',
    'watch:projectCSS',
  ]);


};
