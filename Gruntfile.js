module.exports = function (grunt) {
    // 配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> <%= pkg.website %> <%= pkg.email %> <%= pkg.qq %>*/\n'
            },
            "ismart": {
                files: {
                    "dest/js/ismart.core.min.js": ["js/smart.template.js", "js/smart.core.js", "js/widgets/*.js"],
                    "dest/js/ismart.ui.min.js": ["js/smart.ui.js", "js/widget-ui/*.js", "js/plugins/*.js"]
                }
            }
        },
        clean: ["dest","example"],
        copy: {
            example: {
                files: [
                    {expand: true,
                        src: [
                        "js/**", "index.html", "home.html",
                            "main.html", "topbar-left.html",
                            "topbar-right.html", "css/**",
                            "bootstrap3/**"
                        ], dest: 'example'},
                    {src:"json/menu-example.json",dest:"example/json/menu.json"}
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
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // 注册任务
    grunt.registerTask('default', ['clean', 'copy', 'cssmin','uglify']);
};