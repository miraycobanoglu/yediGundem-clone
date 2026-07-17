const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const { deleteAsync } = require('del');
const rename = require('gulp-rename');

/*
DIST TEMİZLE
*/
function clean() {
    return deleteAsync(['dist']);
}

/*
HTML KOPYALA
*/
function copyHtml() {
    return gulp
        .src('index.html')
        .pipe(gulp.dest('dist'));
}


/*
CSS MINIFY
*/
function minifyCss() {
    return gulp
        .src('assets/css/style.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css'));
}

/*
JS MINIFY
*/
function minifyJs() {
    return gulp
        .src('app.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
}

/*
WATCH
*/
function watchFiles() {
    gulp.watch(
        'assets/css/style.css',
        minifyCss
    );

    gulp.watch(
        'app.js',
        minifyJs
    );

    gulp.watch(
        'index.html',
        copyHtml
    );
}

/*
BUILD
*/
const build = gulp.series(
    clean,
    gulp.parallel(
        copyHtml,
        copyJson,
        minifyCss,
        minifyJs
    )
);


/*
RENAME
*/

function minifyCss() {
    return gulp
        .src('assets/css/style.css')
        .pipe(cleanCSS())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/css'));
}

function minifyJs() {
    return gulp
        .src('app.js')
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/js'));
}


function copyJson() {
    return gulp
        .src('newsData.json')
        .pipe(gulp.dest('dist'));
}

exports.clean = clean;
exports.build = build;
exports.watch = watchFiles;
exports.default = build;