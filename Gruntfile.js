module.exports = function (grunt) {
    // 配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            'smart-all': {
                src: ["js/smart.template.js", "js/smart.core.js", "js/widgets/*.js",
                    "js/smart.ui.js", "js/widgets-ui/*.js", "js/plugins/*.js", "js/utils/*.js"],
                dest: 'dest/js/ismart.all.js'
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
                    return path.replace('.js', ".map")
                }
            },
            "ismart": {
                files: {
                    "dest/js/ismart.all.min.js": "dest/js/ismart.all.js"
                }
            }
        },
        clean: ["dest"],
        copy: {
            dest: {
                files: [
                    {
                        expand: true,
                        src: [
                            "index.html", "home.html", "boot.html",
                            "html/login-panel.html",
                            "html/main-bottom.html",
                            "html/topbar-left.html",
                            "html/topbar-right.html",
                            "images/**", "bootstrap3/**", "font-awesome/**",
                            "layouts/**", "ui-template.html","css/smart.custom.css"
                        ], dest: 'dest'
                    },
                    {src: "json/menu-example.json", dest: "dest/json/menu.json"},
                ]
            }
        },
        cssmin: {
            combine: {
                files: {
                    'dest/css/ismart.ui.min.css': [
                        'css/bootstrap-datetimepicker.min.css',
                        'css/smart.layouts.main0.css',
                        'css/smart.main.css',
                        'css/smart.ui.bootstrap.css',
                        'css/smart.ui.css'
                    ]
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // 注册任务
    grunt.registerTask('default', ['clean', 'concat', 'copy', 'cssmin', 'uglify']);
};