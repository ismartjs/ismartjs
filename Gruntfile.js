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
            base: {
                files: [
                    {expand: true, src: "json/menu-example.json", dest: "dest/json/menu.json"},
                    {expand: true, src: "ui-template.html", dest: "dest/"},
                    {
                        expand: true,
                        src: [
                            "js/bootstrap.min.js",
                            "js/jquery-2.1.1.min.js",
                            "js/jquery.cookie.js",
                            "js/jquery-dateFormat.min.js",
                            "js/jquery-ui-1.10.4.custom.min.js",
                            "js/jquery.mousewheel.min.js",
                            "js/bootstrap-datetimepicker.min.js",
                            "js/bootstrap-datetimepicker.zh-CN.js"
                        ],
                        dest: "dest/"
                    }
                ]
            },
            admin_layout: {
                files: [
                    {
                        expand: true,
                        src: ["layouts/admin/*.html", "layouts/admin/css/*", "layouts/admin/images/*"],
                        dest: 'dest',
                        filter: function (file) {
                            if (file.endsWith('index.html')) {
                                return false;
                            }
                            return true;
                        }
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

    // 注册任务
    grunt.registerTask('default', ['clean', 'concat', 'copy', 'uglify']);
};