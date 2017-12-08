#!/usr/bin/env node

var path = require('path')

var program = require('commander')
var gulp = require('gulp')
var sass = require('gulp-sass')
var less = require('gulp-less')
var babel = require('gulp-babel')
var rename = require("gulp-rename")
var gutil = require('gulp-util')
var plumber = require('gulp-plumber')
var gap = require('gulp-append-prepend')
var pug = require('gulp-pug')
var sourcemaps = require('gulp-sourcemaps')
var bro = require("gulp-bro")
var markdown = require('gulp-markdown')
var uglify = require('gulp-uglify')
var autoprefixer = require('gulp-autoprefixer')
var cleanCSS = require('gulp-clean-css')
var imagemin = require('gulp-imagemin')
var imageminPngquant = require('imagemin-pngquant')
var webp = require('gulp-webp')
var async = require("async")

var CWD = process.cwd()
var ROOT = __dirname
var CWD_name = CWD.split(path.sep)[CWD.split(path.sep).length - 1]

var browserSync = require("browser-sync");
var bs = browserSync.create();

var ts = require('gulp-typescript');

var zip = require('gulp-zip');


var noop = () => {}





var excludeArr = program.exclude ? program.exclude.split(':').map(v => "!" + v) : [];


var build = {
    sass: function (func = noop) {
        console.log('begin: \t sass built');

        var srcArr = [path.resolve(CWD, '**/*.scss'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .pipe(program.sourcemap ? sourcemaps.init() : gutil.noop())
            .pipe(sass().on('error', sass.logError))
            .pipe(autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            }))
            .pipe(program.minify ? cleanCSS({
                compatibility: 'ie8'
            }) : gutil.noop())
            .pipe(program.sourcemap ? sourcemaps.write('./maps') : gutil.noop())
            .on('end', function () {
                console.log('done: \t sass built');
                func()
            })
            .pipe(gulp.dest(dist));
    },
    less: function (func = noop) {
        console.log('begin: \t less built');
        var srcArr = [path.resolve(CWD, '**/*.less'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .pipe(program.sourcemap ? sourcemaps.init() : gutil.noop())
            .pipe(less().on('error', sass.logError))
            .pipe(autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            }))
            .pipe(program.minify ? cleanCSS({
                compatibility: 'ie8'
            }) : gutil.noop())
            .pipe(program.sourcemap ? sourcemaps.write('./maps') : gutil.noop())
            .on('end', function () {
                console.log('done: \t less built');
                func();
            })
            .pipe(gulp.dest(dist));
    },
    es6: function (func = noop) {
        console.log('begin: \t es6 built');
        var srcArr = [path.resolve(CWD, '**/*.es6'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .pipe(plumber())
            .pipe(babel({
                // presets: ["babel-preset-es2015", "babel-preset-es2016", "babel-preset-es2017"].map(require.resolve)
                presets: [
                    [require.resolve('babel-preset-env'), {
                        "targets": {
                            "browsers": ["last 2 versions", "safari >= 7"]
                        }
                    }], require.resolve("babel-preset-stage-0"), require.resolve("babel-preset-stage-1"), require.resolve("babel-preset-stage-2"), require.resolve("babel-preset-stage-3")
                ]
            }))
            // .pipe(program.browserify ? bro() : gutil.noop())
            .pipe(program.babelpolyfill ? gap.prependFile(path.resolve(ROOT, 'lib/polyfill.min.js')) : gutil.noop())
            .on('error', function (e) {
                gutil.log(e);
            })
            .on('end', function () {
                console.log('done: \t es6 built');
                func();
            })
            .pipe(rename(function (path) {
                path.extname = ".js"
            }))
            .pipe(program.browserify ? bro() : gutil.noop())
            .pipe(program.minify ? uglify() : gutil.noop())
            .pipe(gulp.dest(dist))
    },
    pug: function (func = noop) {
        console.log('begin: \t pug built');
        var srcArr = [path.resolve(CWD, '**/*.pug'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .pipe(pug({
                pretty: true
            }))
            .on('error', function (e) {
                gutil.log(e);
            })
            .on('end', function () {
                console.log('done: \t pug built');
                func();
            })
            .pipe(rename(function (path) {
                path.extname = ".html"
            }))
            .pipe(gulp.dest(dist));
    },
    markdown: function () {
        console.log('begin: \t markdown built');
        var srcArr = [path.resolve(CWD, '**/*.md'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .pipe(markdown())
            .on('error', function (e) {
                gutil.log(e);
            })
            .on('end', function () {
                console.log('done: \t markdown built');
            })
            .pipe(rename(function (path) {
                path.extname = ".html"
            }))
            .pipe(gulp.dest(dist));
    },
    imageMin: function () {
        console.log('begin: \t imageMin built');
        var srcArr = [path.resolve(CWD, '**/*.png'), path.resolve(CWD, '**/*.jpg'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .on('error', function (e) {
                gutil.log(e);
            })
            .on('end', function () {
                console.log('done: \t imageMin built');
            })
            .pipe(imagemin([
                imagemin.gifsicle({
                    interlaced: true
                }),
                imagemin.jpegtran({
                    progressive: true
                }),
                imageminPngquant({
                    // quality: "80"
                    verbose: true
                })
            ]))
            .pipe(gulp.dest(dist));
    },
    image2Webp: () => {
        console.log('Begin ImageMin');
        async.parallel([
                function (callback) {
                    build.jpg2Webp().then(callback);
                },
                function (callback) {
                    build.png2Webp().then(callback);
                }
            ],
            // optional callback 
            function (err, results) {
                // the results array will equal ['one','two'] even though 
                // the second function had a shorter timeout. 
                console.log('Done ImageMin');
            });
    },
    png2Webp: () => {
        return new Promise((resolve, reject) => {
            var srcArr = [path.resolve(CWD, '**/*.png'), '!**/node_modules/**/*'].concat(excludeArr);
            var dist = path.resolve(CWD, './');
            gulp.src(srcArr)
                .on('error', function (e) {
                    gutil.log(e);
                    reject(e)
                })
                .on('end', function () {
                    console.log('done: \t webp built');
                    resolve();
                })
                .pipe(webp())
                .pipe(rename(function (path) {
                    path.basename += ".png"
                }))
                .pipe(gulp.dest(dist));
        });
    },
    jpg2Webp: () => {
        return new Promise((resolve, reject) => {
            var srcArr = [path.resolve(CWD, '**/*.jpg'), '!**/node_modules/**/*'].concat(excludeArr);
            var dist = path.resolve(CWD, './');
            gulp.src(srcArr)
                .on('error', function (e) {
                    gutil.log(e);
                    reject(e)
                })
                .on('end', function () {
                    console.log('done: \t webp built');
                    resolve();
                })
                .pipe(webp())
                .pipe(rename(function (path) {
                    path.basename += ".jpg"
                }))
                .pipe(gulp.dest(dist));
        });
    },
    startServer: () => {
        bs.init({
            server: CWD,
            open: "external"
        });
    },
    typescript: () => {
        console.log('begin: \t typescript built');
        return new Promise((resolve, reject) => {
            var srcArr = [path.resolve(CWD, '**/*.ts'), '!**/node_modules/**/*', "!**/*.d.ts"].concat(excludeArr);
            var dist = path.resolve(CWD, './');
            gulp.src(srcArr)
                .pipe(ts({
                    noImplicitAny: true,
                    target: "es5",
                    declaration: true
                }, ts.reporter.longReporter(true)))
                .on('end', function () {
                    console.log('done: \t typescript built');
                    resolve();
                })
                .pipe(gulp.dest(dist));
        });
    },
    zip: () => {
        console.log('begin: \t zip built');
        return new Promise((resolve, reject) => {
            var srcArr = [path.resolve(CWD, '**/*'), '!**/node_modules/**/*', "!**/*.d.ts", "!**/*.scss", "!**/*.es6", "!**/*.less", "!**/*.pug"].concat(excludeArr);
            var dist = path.resolve(CWD, './../');
            gulp.src(srcArr)
                .pipe(zip(CWD_name + '.zip'))
                .on('error', function (e) {
                    gutil.log(e);
                    reject(e)
                })
                .on('end', function () {
                    console.log('done: \t zip built');
                    resolve();
                })
                .pipe(gulp.dest(dist));
        });
    }
};

gulp.task('sass:watch', function () {
    gulp.watch(['**/*.scss', '!**/node_modules/**/*'], {
        cwd: CWD
    }, () => {
        build.sass(() => {
            if (program.server) {
                bs.reload("*.css");
            }
        });
    });
});
gulp.task('less:watch', function () {
    gulp.watch(['**/*.less', '!**/node_modules/**/*'], {
        cwd: CWD
    }, () => {
        build.less(() => {
            if (program.server) {
                bs.reload("*.css");
            }
        })
    });
});
gulp.task('es6:watch', function () {
    gulp.watch(['**/*.es6', '!**/node_modules/**/*'], {
        cwd: CWD
    }, () => {
        build.es6(() => {
            if (program.server) {
                bs.reload("*.js");
            }
        })
    });
});
gulp.task('pug:watch', function () {
    gulp.watch(['**/*.pug', '!**/node_modules/**/*'], {
        cwd: CWD
    }, () => {
        build.pug(() => {
            if (program.server) {
                setTimeout(() => {
                    bs.reload();
                }, 100);
                
            }
        })
    });
});
gulp.task('markdown:watch', function () {
    gulp.watch(['**/*.md', '!**/node_modules/**/*'], {
        cwd: CWD
    }, build.markdown);
});


gulp.task('typescript:watch', function () {
    gulp.watch(['**/*.ts', '!**/node_modules/**/*'], {
        cwd: CWD
    }, build.typescript);
});



program
    .option('-p, --babelpolyfill', 'use babel-polyfill. Default: false')
    .option('-b, --build', 'build only')
    .option('--br, --browserify', 'browserify modules')
    .option('-w, --watch', 'watch mode')
    .option('-s, --sourcemap', 'write sourcemap')
    .option('-m, --minify', 'minify')
    .option('-x, --exclude <string>', 'exclude glob pattern. E.g. "**/*.min.js:**/*.min.css"')
    .option('--webp', 'generate webp')
    .option('--zip', 'zip project for release')
    .option('--server', 'start static server')
    .parse(process.argv);

// console.log(program.exclude);


if(program.zip) {
    build.zip();
}

if (program.webp) {
    build.image2Webp();
}

if (program.build) {
    build.sass();
    build.less();
    build.es6();
    build.pug();
    build.markdown();
    build.imageMin();
    build.typescript();
} 

if(program.watch){
    gulp.start(["sass:watch", 'less:watch', 'es6:watch', 'pug:watch', 'markdown:watch', "typescript:watch"], function () {
        console.log('laziness is ready...');
    });
}

if (program.server) {
    build.startServer()
}