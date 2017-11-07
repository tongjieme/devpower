#!/usr/bin/env node

var path         = require('path')

var program      = require('commander')
var gulp         = require('gulp')
var sass         = require('gulp-sass')
var less         = require('gulp-less')
var babel        = require('gulp-babel')
var rename       = require("gulp-rename")
var gutil        = require('gulp-util')
var plumber      = require('gulp-plumber')
var gap          = require('gulp-append-prepend')
var pug          = require('gulp-pug')
var sourcemaps   = require('gulp-sourcemaps')
var bro          = require("gulp-bro")
var markdown     = require('gulp-markdown')
var uglify       = require('gulp-uglify')
var autoprefixer = require('gulp-autoprefixer')
var cleanCSS     = require('gulp-clean-css')


var CWD        = process.cwd()
var ROOT       = __dirname




program
    .option('-p, --babelpolyfill', 'use babel-polyfill. Default: false')
    .option('-b, --build', 'build only')
    .option('-w, --browserify', 'browserify modules')
    .option('-s, --sourcemap', 'write sourcemap')
    .option('-m, --minify', 'minify')
    .option('-x, --exclude <string>', 'exclude glob pattern. E.g. "**/*.min.js:**/*.min.css"')
    .parse(process.argv);

// console.log(program.exclude);




var excludeArr = program.exclude ? program.exclude.split(':').map(v => "!" + v) : [];


var build = {
    sass: function () {
        console.log('begin: \t sass built');

        var srcArr = [path.resolve(CWD, '**/*.scss'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist   = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .pipe(program.sourcemap ? sourcemaps.init() : gutil.noop())
            .pipe(sass().on('error', sass.logError))
            .pipe(autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            }))
            .pipe(program.minify ? cleanCSS({ compatibility: 'ie8' }) : gutil.noop())
            .pipe(program.sourcemap ? sourcemaps.write('./maps') : gutil.noop())
            .on('end', function () {
                console.log('done: \t sass built');
            })
            .pipe(gulp.dest(dist));
    },
    less: function () {
        console.log('begin: \t less built');
        var srcArr = [path.resolve(CWD, '**/*.less'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist   = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .pipe(program.sourcemap ? sourcemaps.init() : gutil.noop())
            .pipe(less().on('error', sass.logError))
            .pipe(autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            }))
            .pipe(program.minify ? cleanCSS({ compatibility: 'ie8' }) : gutil.noop())
            .pipe(program.sourcemap ? sourcemaps.write('./maps') : gutil.noop())
            .on('end', function () {
                console.log('done: \t less built');
            })
            .pipe(gulp.dest(dist));
    },
    es6: function () {
        console.log('begin: \t es6 built');
        var srcArr = [path.resolve(CWD, '**/*.es6'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist   = path.resolve(CWD, './');
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
            })
            .pipe(rename(function (path) {
                path.extname = ".js"
            }))
            .pipe(program.minify ? uglify() : gutil.noop())
            .pipe(gulp.dest(dist))
            .pipe(program.browserify ? bro() : gutil.noop())
            .pipe(program.browserify ? gulp.dest(dist) : gutil.noop())
    },
    pug: function () {
        console.log('begin: \t pug built');
        var srcArr = [path.resolve(CWD, '**/*.pug'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist   = path.resolve(CWD, './');
        return gulp.src(srcArr)
            .pipe(pug({
                pretty: true
            }))
            .on('error', function (e) {
                gutil.log(e);
            })
            .on('end', function () {
                console.log('done: \t pug built');
            })
            .pipe(rename(function (path) {
                path.extname = ".html"
            }))
            .pipe(gulp.dest(dist));
    },
    markdown: function(){
        console.log('begin: \t markdown built');
        var srcArr = [path.resolve(CWD, '**/*.md'), '!**/node_modules/**/*'].concat(excludeArr);
        var dist   = path.resolve(CWD, './');
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
    }
};

gulp.task('sass:watch', function () {
    gulp.watch(['**/*.scss', '!**/node_modules/**/*'], {
        cwd: CWD
    }, build.sass);
});
gulp.task('less:watch', function () {
    gulp.watch(['**/*.less', '!**/node_modules/**/*'], {
        cwd: CWD
    }, build.less);
});
gulp.task('es6:watch', function () {
    gulp.watch(['**/*.es6', '!**/node_modules/**/*'], {
        cwd: CWD
    }, build.es6);
});
gulp.task('pug:watch', function () {
    gulp.watch(['**/*.pug', '!**/node_modules/**/*'], {
        cwd: CWD
    }, build.pug);
});
gulp.task('markdown:watch', function () {
    gulp.watch(['**/*.md', '!**/node_modules/**/*'], {
        cwd: CWD
    }, build.markdown);
});






if (program.build) {
    build.sass();
    build.less();
    build.es6();
    build.pug();
    build.markdown();
} else {
    gulp.start(["sass:watch", 'less:watch', 'es6:watch', 'pug:watch', 'markdown:watch'], function () {
        console.log('laziness is ready...');
    });
}
