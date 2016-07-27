module.exports = function (grunt) {
    // 配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            'ismartjs': {
                src: [
                    "js/src/smart.core.js",
                    "js/src/smart.template.js",
                    "js/src/smart.ui.js",
                    "js/src/plugins/*.js",
                    "js/src/widgets/*.js",
                    "js/src/widgets-ui/*.js"
                ],
                dest: 'dist/js/ismartjs.all.js'
            },
            'ismartjs-bootstrap': {
                src: ["js/bootstrap-plugins/**/*.js"],
                dest: 'dist/js/bootstrap-plugins.js'
            }
        },
        less: {
            development: {
                files: [{
                    expand: true,
                    cwd: 'less',
                    src: ['*.less'],
                    dest: "less",
                    ext: '.css'
                }]
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> version:<%=pkg.version%> <%= grunt.template.today("yyyy-mm-dd") %> ' +
                '<%= pkg.website %> Email:<%= pkg.email %> QQ: <%= pkg.QQ %>*/\n',
                sourceMap: function (path) {
                    return path.replace('.js', ".map")
                },
                sourceMapRoot: "../../",
                sourceMappingURL: function (path) {
                    var paths = path.split("/");
                    return paths[paths.length - 1].replace('.js', ".map")
                }
            },
            "ismartjs": {
                files: {
                    "dist/js/ismartjs.all.min.js": "dist/js/ismartjs.all.js"
                }
            },
            "ismartjs-bootstrap": {
                files: {
                    "dist/js/bootstrap-plugins.min.js": "dist/js/bootstrap-plugins.js"
                }
            }
        },
        cssmin: {
            compress: {
                files: {
                    'dist/css/ismart.min.css': [
                        "less/**/*.css"
                    ]
                }
            }
        },
        clean: ["dist/*"],
        copy: {
            css: {
                files: [
                    {expand: true, src: "css/**/*", dest: "dist/"}
                ]
            },
            "3rdjs": {
                files: [
                    {
                        expand: true,
                        src: "js/3rd/**/*",
                        dest: "dist"
                    }
                ]
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');

    // 注册任务
    grunt.registerTask('default', ['clean', 'less', 'concat', 'copy', 'uglify', 'cssmin']);
};