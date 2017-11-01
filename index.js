#!/usr/bin/env node
/*

snippet -u kannonboy -p correcthorsebatterystaple my_awesome_file

*/

var path = require('path');
var gulp = require('gulp');
var sass = require('gulp-sass');
var less = require('gulp-less');
var babel = require('gulp-babel');
var rename = require("gulp-rename");
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');

var CWD = process.cwd();


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
        return gulp.src(path.resolve(CWD, '**/*.es6'))
            .pipe(plumber())
            .pipe(babel({
                presets: ["babel-preset-es2015", "babel-preset-es2016", "babel-preset-es2017"].map(require.resolve)
            }))
            .on('error', function (e) {
                gutil.log(e);
            })
            .pipe(rename(function (path) {
                path.extname = ".js"
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

gulp.start(["sass:watch", 'less:watch', 'es6:watch'], function () {
    console.log('laziness is ready...');
});
