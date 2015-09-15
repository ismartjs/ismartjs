module.exports = function (grunt) {
    // 配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            'smart-all': {
                src: ["js/smart.template.js", "js/smart.core.js", "js/widgets/*.js","js/smart.ui.js", "js/widgets-ui/*.js", "js/plugins/*.js"],
                dest: 'dest/js/ismart.all.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> version:<%=pkg.version%> <%= grunt.template.today("yyyy-mm-dd") %> ' +
                    '<%= pkg.website %> Email:<%= pkg.email %> QQ: <%= pkg.QQ %>*/\n',
                sourceMap:function(path) { return path.replace('.js',".map")},
                sourceMapRoot:"../../",
                sourceMappingURL: function(path) { return path.replace('.js',".map")}
            },
            "ismart": {
                files: {
                    "dest/js/ismart.all.min.js": "dest/js/ismart.all.js"
                }
            }
        },
        clean: ["dest","example"],
        copy: {
            example: {
                files: [
                    {expand: true,
                        src: [
                        "js/**", "index.html", "home.html", "boot.html", "login-panel.html", "main-bottom.html",
                            "main.html", "topbar-left.html", "topbar-right.html", "css/**", "images/**",
                            "bootstrap3/**","font-awesome/**","layouts/**"
                        ], dest: 'example'},
                    {src:"json/menu-example.json",dest:"example/json/menu.json"},
                    {src:"ui-template.html",dest:"example/ui-template.html"}
                ]
            },
            dest: {
                files: [
                    {src:'ui-template.html',dest:"dest/"}
                ]
            }
        },
        cssmin: {
            combine: {
                files: {
                    'dest/css/ismart.ui.min.css': 'css/*.css'
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
    grunt.registerTask('default', ['clean', 'concat', 'copy', 'cssmin','uglify']);
};