#!/usr/bin/env node

/*

snippet -u kannonboy -p correcthorsebatterystaple my_awesome_file

*/

var path       = require('path')

var program    = require('commander')
var gulp       = require('gulp')
var sass       = require('gulp-sass')
var less       = require('gulp-less')
var babel      = require('gulp-babel')
var rename     = require("gulp-rename")
var gutil      = require('gulp-util')
var plumber    = require('gulp-plumber')
var gap        = require('gulp-append-prepend')
var pug        = require('gulp-pug')
var sourcemaps = require('gulp-sourcemaps')
var bro        = require("gulp-bro")
var markdown   = require('gulp-markdown')


var CWD        = process.cwd()
var ROOT       = __dirname

var build = {
    sass: function () {
        console.log('begin: \t sass built');
        return gulp.src(path.resolve(CWD, '**/*.scss'))
            .pipe(program.sourcemap ? sourcemaps.init() : gutil.noop())
            .pipe(sass().on('error', sass.logError))
            .pipe(program.sourcemap ? sourcemaps.write('./maps') : gutil.noop())
            .on('end', function () {
                console.log('done: \t sass built');
            })
            .pipe(gulp.dest(path.resolve(CWD, './')));
    },
    less: function () {
        console.log('begin: \t less built');
        return gulp.src(path.resolve(CWD, '**/*.less'))
            .pipe(program.sourcemap ? sourcemaps.init() : gutil.noop())
            .pipe(less().on('error', sass.logError))
            .pipe(program.sourcemap ? sourcemaps.write('./maps') : gutil.noop())
            .on('end', function () {
                console.log('done: \t less built');
            })
            .pipe(gulp.dest(path.resolve(CWD, './')));
    },
    es6: function () {
        console.log('begin: \t es6 built');
        return gulp.src(path.resolve(CWD, '**/*.es6'))
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
            .pipe(gulp.dest(path.resolve(CWD, './')))
            .pipe(program.browserify ? bro() : gutil.noop())
            .pipe(program.browserify ? gulp.dest(path.resolve(CWD, './')) : gutil.noop())
    },
    pug: function () {
        console.log('begin: \t pug built');
        return gulp.src(path.resolve(CWD, '**/*.pug'))
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
            .pipe(gulp.dest(path.resolve(CWD, './')));
    },
    markdown: function(){
        console.log('begin: \t markdown built');
        return gulp.src(path.resolve(CWD, '**/*.md'))
            .pipe(markdown())
            .on('error', function (e) {
                gutil.log(e);
            })
            .on('end', function () {
                console.log('done: \t pug built');
            })
            .pipe(rename(function (path) {
                path.extname = ".html"
            }))
            .pipe(gulp.dest(path.resolve(CWD, './')));
    }
};

gulp.task('sass:watch', function () {
    gulp.watch('**/*.scss', {
        cwd: CWD
    }, build.sass);
});
gulp.task('less:watch', function () {
    gulp.watch('**/*.less', {
        cwd: CWD
    }, build.less);
});
gulp.task('es6:watch', function () {
    gulp.watch('**/*.es6', {
        cwd: CWD
    }, build.es6);
});
gulp.task('pug:watch', function () {
    gulp.watch('**/*.pug', {
        cwd: CWD
    }, build.pug);
});
gulp.task('markdown:watch', function () {
    gulp.watch('**/*.md', {
        cwd: CWD
    }, build.markdown);
});


program
    .option('-p, --babelpolyfill', 'use babel-polyfill. Default: false')
    .option('-b, --build', 'build only')
    .option('-w, --browserify', 'browserify modules')
    .option('-s, --sourcemap', 'write sourcemap')
    .parse(process.argv);


console.log(program.browserify);



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
