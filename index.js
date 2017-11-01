#!/usr/bin/env node
/*

snippet -u kannonboy -p correcthorsebatterystaple my_awesome_file

*/

var path = require('path');

var program = require('commander');
var gulp = require('gulp');
var sass = require('gulp-sass');
var less = require('gulp-less');
var babel = require('gulp-babel');
var rename = require("gulp-rename");
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var gap = require('gulp-append-prepend');
var pug = require('gulp-pug');

var CWD = process.cwd();
var ROOT = __dirname;

var build = {
    sass: function () {
        return gulp.src(path.resolve(CWD, '**/*.scss'))
            .pipe(sass().on('error', sass.logError))
            .pipe(gulp.dest(path.resolve(CWD, './')));
    },
    less: function () {
        return gulp.src(path.resolve(CWD, '**/*.less'))
            .pipe(less().on('error', sass.logError))
            .pipe(gulp.dest(path.resolve(CWD, './')));
    },
    es6: function () {
        console.log('begin: \t es6 built');
        return gulp.src(path.resolve(CWD, '**/*.es6'))
            .pipe(plumber())
            .pipe(babel({
                // presets: ["babel-preset-es2015", "babel-preset-es2016", "babel-preset-es2017"].map(require.resolve)
                presets: [[require.resolve('babel-preset-env'), {
                    "targets": {
                        "browsers": ["last 2 versions", "safari >= 7"]
                    }
                }]]
            }))
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
            .pipe(gulp.dest(path.resolve(CWD, './')));
    },
    pug: function () {
        return gulp.src(path.resolve(CWD, '**/*.pug'))
            .pipe(pug({
                // Your options in here. 
            }))
            .on('error', function (e) {
                gutil.log(e);
            })
            .pipe(rename(function (path) {
                path.extname = ".html"
            }))
            .pipe(gulp.dest(path.resolve(CWD, './')));
    }
};

gulp.task('sass:watch', function () {
    gulp.watch(path.resolve(CWD, '**/*.scss'), build.sass);
});
gulp.task('less:watch', function () {
    gulp.watch(path.resolve(CWD, '**/*.less'), build.less);
});
gulp.task('es6:watch', function () {
    gulp.watch(path.resolve(CWD, '**/*.es6'), build.es6);
});
gulp.task('pug:watch', function () {
    gulp.watch(path.resolve(CWD, '**/*.pug'), build.pug);
});


program
 .option('-p, --babelpolyfill <true>', 'use babel-polyfill. Default: false')
 .parse(process.argv);


gulp.start(["sass:watch", 'less:watch', 'es6:watch', 'pug:watch'], function () {
    console.log('laziness is ready...');
});

