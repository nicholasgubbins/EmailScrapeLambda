var gulp = require('gulp');
var clean = require('gulp-clean');
var zip = require('gulp-zip');
var merge = require('merge-stream');
var install = require("gulp-install");


gulp.task('clean', function () {
    console.log('cleaning');
    var build = gulp.src('build', {read: false})
        .pipe(clean());
    var dist = gulp.src('dist', {read: false})
        .pipe(clean());

    return merge(build, dist);
});

gulp.task('build', ['clean'], function() {
    console.log('building');
    var index = gulp.src('index.js')
        .pipe(gulp.dest('build'));
    var package = gulp.src('package.json')
        .pipe(gulp.dest('build'))
        .pipe(install({production: true}));
    return merge(index,package);
});

gulp.task('zip', ['build'], function() {

    return gulp.src('build/**')
        .pipe(zip('archive.zip'))
        .pipe(gulp.dest('dist'));
});
