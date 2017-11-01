#!/usr/bin/env node
/*

snippet -u kannonboy -p correcthorsebatterystaple my_awesome_file

*/

var path = require('path');
var gulp = require('gulp');
var sass = require('gulp-sass');
var less = require('gulp-less');

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
    }
};

gulp.task('sass:watch', function () {
    gulp.watch(path.resolve(CWD, '**/*.scss'), build.sass);
});
gulp.task('less:watch', function () {
    gulp.watch(path.resolve(CWD, '**/*.less'), build.less);
});

gulp.start(["sass:watch", 'less:watch'], function () {
    console.log('ready');
});
