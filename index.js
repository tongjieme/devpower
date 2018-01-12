#!/usr/bin/env node

var path = require("path");

var program = require("commander");
var gulp = require("gulp");
var sass = require("gulp-sass");
var less = require("gulp-less");
var babel = require("gulp-babel");
var rename = require("gulp-rename");
var gutil = require("gulp-util");
var plumber = require("gulp-plumber");
var gap = require("gulp-append-prepend");
var pug = require("gulp-pug");
var sourcemaps = require("gulp-sourcemaps");
var bro = require("gulp-bro"); // browserify
var markdown = require("gulp-markdown");
var uglify = require("gulp-uglify");
var autoprefixer = require("gulp-autoprefixer");
var cleanCSS = require("gulp-clean-css");
var imagemin = require("gulp-imagemin");
var imageminPngquant = require("imagemin-pngquant");
var webp = require("gulp-webp");
var async = require("async");

var CWD = process.cwd();
var ROOT = __dirname;
var CWD_name = CWD.split(path.sep)[CWD.split(path.sep).length - 1]; // directory name of CWD

var browserSync = require("browser-sync");
var bs = browserSync.create();

var ts = require("gulp-typescript");

var zip = require("gulp-zip");

var noop = require("./lib/utils").noop;
var timenow = require("./lib/utils").timenow;

var excludeArr = program.exclude ?
    program.exclude.split(",").map(v => "!" + v) :
    [];

var log = (msg, status = "building") => {
    console.log(`${timenow()} ${msg} \t ${status}`);
};

var build = {
    sass: function (func = noop) {
        log("sass", "building");

        var srcArr = [
            path.resolve(CWD, "**/*.scss"),
            path.resolve(CWD, "**/*.sass"),
            "!**/node_modules/**/*"
        ].concat(excludeArr);
        var dist = path.resolve(CWD, "./");
        return gulp
            .src(srcArr)
            .pipe(program.sourcemap ? sourcemaps.init() : gutil.noop())
            .pipe(sass().on("error", sass.logError))
            .pipe(
                autoprefixer({
                    browsers: ["last 2 versions"],
                    cascade: false
                })
            )
            .pipe(
                program.minify ?
                cleanCSS({
                    compatibility: "ie8"
                }) :
                gutil.noop()
            )
            .pipe(program.sourcemap ? sourcemaps.write("./maps") : gutil.noop())
            .on("end", function () {
                log("sass", "done");
                func();
            })
            .pipe(gulp.dest(dist));
    },
    less: function (func = noop) {
        log("less", "building");
        var srcArr = [
            path.resolve(CWD, "**/*.less"),
            "!**/node_modules/**/*"
        ].concat(excludeArr);
        var dist = path.resolve(CWD, "./");
        return gulp
            .src(srcArr)
            .pipe(program.sourcemap ? sourcemaps.init() : gutil.noop())
            .pipe(less().on("error", sass.logError))
            .pipe(
                autoprefixer({
                    browsers: ["last 2 versions"],
                    cascade: false
                })
            )
            .pipe(
                program.minify ?
                cleanCSS({
                    compatibility: "ie8"
                }) :
                gutil.noop()
            )
            .pipe(program.sourcemap ? sourcemaps.write("./maps") : gutil.noop())
            .on("end", function () {
                log("less", "done");
                func();
            })
            .pipe(gulp.dest(dist));
    },
    es6: function (func = noop) {
        log("es6", "building");
        var srcArr = [
            path.resolve(CWD, "**/*.es6"),
            "!**/node_modules/**/*"
        ].concat(excludeArr);
        var dist = path.resolve(CWD, "./");
        return (
            gulp
            .src(srcArr)
            .pipe(plumber())
            .pipe(
                babel({
                    // presets: ["babel-preset-es2015", "babel-preset-es2016", "babel-preset-es2017"].map(require.resolve)
                    presets: [
                        [
                            require.resolve("babel-preset-env"),
                            {
                                targets: {
                                    browsers: ["last 2 versions", "safari >= 7"]
                                }
                            }
                        ],
                        require.resolve("babel-preset-stage-0"),
                        require.resolve("babel-preset-stage-1"),
                        require.resolve("babel-preset-stage-2"),
                        require.resolve("babel-preset-stage-3")
                    ]
                })
            )
            // .pipe(program.browserify ? bro() : gutil.noop())
            .pipe(
                program.babelpolyfill ?
                gap.prependFile(path.resolve(ROOT, "lib/polyfill.min.js")) :
                gutil.noop()
            )
            .on("error", function (e) {
                gutil.log(e);
            })
            .pipe(
                rename(function (path) {
                    path.extname = ".js";
                })
            )
            // .pipe(program.minify ? uglify() : gutil.noop())
            .pipe(gulp.dest(dist))
            .pipe(program.browserify ? bro() : gutil.noop())
            .pipe(program.minify ? uglify() : gutil.noop())
            .on("end", function () {
                log("es6", "done");
                func();
            })
            .pipe(gulp.dest(dist))
        );
    },
    pug: function (func = noop) {
        log("pug", "building");
        var srcArr = [
            path.resolve(CWD, "**/*.pug"),
            "!**/node_modules/**/*"
        ].concat(excludeArr);
        var dist = path.resolve(CWD, "./");
        return gulp
            .src(srcArr)
            .pipe(
                pug({
                    pretty: true
                })
            )
            .on("error", function (e) {
                gutil.log(e);
            })
            .on("end", function () {
                log("pug", "done");
                func();
            })
            .pipe(
                rename(function (path) {
                    path.extname = ".html";
                })
            )
            .pipe(gulp.dest(dist));
    },
    md: function () {
        log("markdown", "building");
        var srcArr = [path.resolve(CWD, "**/*.md"), "!**/node_modules/**/*"].concat(
            excludeArr
        );
        var dist = path.resolve(CWD, "./");
        return gulp
            .src(srcArr)
            .pipe(markdown())
            .on("error", function (e) {
                gutil.log(e);
            })
            .on("end", function () {
                log("markdown", "done");
            })
            .pipe(
                rename(function (path) {
                    path.extname = ".html";
                })
            )
            .pipe(gulp.dest(dist));
    },
    imageMin: function () {
        log("imageMin", "building");
        var srcArr = [
            path.resolve(CWD, "**/*.png"),
            path.resolve(CWD, "**/*.jpg"),
            "!**/node_modules/**/*"
        ].concat(excludeArr);
        var dist = path.resolve(CWD, "./");
        return gulp
            .src(srcArr)
            .on("error", function (e) {
                gutil.log(e);
            })
            .on("end", function () {
                log("imageMin", "done");
            })
            .pipe(
                imagemin([
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
                ])
            )
            .pipe(gulp.dest(dist));
    },
    image2Webp: () => {
        log("image2Webp", "building");
        async.parallel(
            [
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
                log("image2Webp", "done");
            }
        );
    },
    png2Webp: () => {
        return new Promise((resolve, reject) => {
            var srcArr = [
                path.resolve(CWD, "**/*.png"),
                "!**/node_modules/**/*"
            ].concat(excludeArr);
            var dist = path.resolve(CWD, "./");
            gulp
                .src(srcArr)
                .on("error", function (e) {
                    gutil.log(e);
                    reject(e);
                })
                .on("end", function () {
                    resolve();
                })
                .pipe(webp())
                .pipe(
                    rename(function (path) {
                        path.basename += ".png";
                    })
                )
                .pipe(gulp.dest(dist));
        });
    },
    jpg2Webp: () => {
        return new Promise((resolve, reject) => {
            var srcArr = [
                path.resolve(CWD, "**/*.jpg"),
                "!**/node_modules/**/*"
            ].concat(excludeArr);
            var dist = path.resolve(CWD, "./");
            gulp
                .src(srcArr)
                .on("error", function (e) {
                    gutil.log(e);
                    reject(e);
                })
                .on("end", function () {
                    resolve();
                })
                .pipe(webp())
                .pipe(
                    rename(function (path) {
                        path.basename += ".jpg";
                    })
                )
                .pipe(gulp.dest(dist));
        });
    },
    startServer: () => {
        bs.init({
            server: CWD,
            open: "external"
        });
    },
    ts: () => {
        log("typescript", "building");
        return new Promise((resolve, reject) => {
            var srcArr = [
                path.resolve(CWD, "**/*.ts"),
                "!**/node_modules/**/*",
                "!" + path.resolve(CWD, "**/*.d.ts")
            ].concat(excludeArr);
            var dist = path.resolve(CWD, "./");
            gulp
                .src(srcArr)
                .pipe(
                    ts({
                            noImplicitAny: true,
                            target: "es5",
                            declaration: false,
                            sourceMap: true
                        },
                        ts.reporter.longReporter(true)
                    )
                )
                .on("end", function () {
                    log("typescript", "done");
                    resolve();
                })
                .pipe(gulp.dest(dist))
                .pipe(program.browserify ? bro() : gutil.noop())
                .pipe(gulp.dest(dist))
        });
    },
    zip: () => {
        log("zip", "building");
        return new Promise((resolve, reject) => {
            var srcArr = [
                path.resolve(CWD, "**/*"),
                "!**/node_modules/**/*",
                "!**/*.d.ts",
                "!**/*.scss",
                "!**/*.es6",
                "!**/*.less",
                "!**/*.pug"
            ].concat(excludeArr);
            var dist = path.resolve(CWD, "./../");
            gulp
                .src(srcArr)
                .pipe(zip(CWD_name + ".zip"))
                .on("error", function (e) {
                    gutil.log(e);
                    reject(e);
                })
                .on("end", function () {
                    log("zip", "done");
                    resolve();
                })
                .pipe(gulp.dest(dist));
        });
    }
};

gulp.task("sass:watch", function(){
    gulp.watch(
      ["**/*.scss", "**/*.sass", "!**/node_modules/**/*"],
      {
        cwd: CWD
      },
      () => {
        build.sass(() => {
          if (program.server) {
            bs.reload("*.css");
          }
        });
      }
    );
});

gulp.task("less:watch", function () {
    gulp.watch(
        ["**/*.less", "!**/node_modules/**/*"], {
            cwd: CWD
        },
        () => {
            build.less(() => {
                if (program.server) {
                    bs.reload("*.css");
                }
            });
        }
    );
});
gulp.task("es6:watch", function () {
    gulp.watch(
        ["**/*.es6", "!**/node_modules/**/*"], {
            cwd: CWD
        },
        () => {
            build.es6(() => {
                if (program.server) {
                    bs.reload("*.js");
                }
            });
        }
    );
});
gulp.task("pug:watch", function () {
    gulp.watch(
        ["**/*.pug", "!**/node_modules/**/*"], {
            cwd: CWD
        },
        () => {
            build.pug(() => {
                if (program.server) {
                    setTimeout(() => {
                        bs.reload();
                    }, 100);
                }
            });
        }
    );
});
gulp.task("md:watch", function () {
    gulp.watch(
        ["**/*.md", "!**/node_modules/**/*"], {
            cwd: CWD
        },
        build.md
    );
});

gulp.task("ts:watch", function () {
    
    gulp.watch(
        ["**/*.ts", "!**/node_modules/**/*", "!**/*.d.ts"], {
            cwd: CWD
        },
        build.ts
    );
});

program
  .version("0.1.1")
  .usage("[options] <file ...>")
  .option("-p, --babelpolyfill", "use babel-polyfill. Default: false")
  .option("-b, --build", "build only")
  .option("--br, --browserify", "browserify modules")
  .option(
    "-w, --watch [extensions]",
    'watch files, e.g. "scss,sass,es6,ts,pug,less,md". default: "scss,sass,es6,pug,less"'
  )
  .option("-s, --sourcemap", "write sourcemap")
  .option("-m, --minify", "minify")
  .option(
    "-x, --exclude <string>",
    'exclude glob pattern. E.g. "**/*.min.js,**/*.min.css"'
  )
  .option("--webp", "generate webp")
  .option("--zip", "zip project for release")
  .option("--server", "start static server")
  .parse(process.argv);

  
if (program.zip) {
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
    build.md();
    build.imageMin();
    build.ts();
}
if (program.watch) {
    program.watch =
        program.watch === true ? "scss,es6,pug,less,ts" : program.watch;

    if (program.watch.indexOf("scss") > -1 && program.watch.indexOf("sass") == -1) {
        program.watch = program.watch.replace("scss", "sass");
    }


    var file_exts = program.watch;
    var watch = program.watch
                .replace(/\s/g, "")
                .split(",")
                .map(v => `${v}:watch`);

        
    gulp.start(watch, function () {
        console.log(`devpower is ready... \nwatch: ${file_exts}`);
    });
}

if (program.server) {
    build.startServer();
}
