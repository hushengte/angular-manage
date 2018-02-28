'use strict';

var gulp = require('gulp');
var connect = require('gulp-connect');
var templateCache = require('gulp-angular-templatecache');
var uglify = require('gulp-uglify');
var cleanCss = require('gulp-clean-css');
var concat = require('gulp-concat');
var mainBowerFiles = require('main-bower-files');

gulp.task('vendor:fonts', function() {
	return gulp.src('bower_components/font-awesome/fonts/**')
		.pipe(gulp.dest('src/fonts'));
});
gulp.task('vendor:css', function() {
	return gulp.src(mainBowerFiles('**/*.css'))
		.pipe(concat('vendor.min.css'))
		.pipe(cleanCss())
		.pipe(gulp.dest('src/css'))
});
gulp.task('vendor:js', function() {
	return gulp.src(mainBowerFiles('**/*.js'))
		.pipe(concat('vendor.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('src/js'));
});

gulp.task('templates', function() {
	gulp.src('src/templates/*.html')
		.pipe(templateCache({module: 'app'}))
		.pipe(gulp.dest('src/js'));
});
gulp.task('scripts', function() {
	return gulp.src('src/js/**/*.js')
		.pipe(concat('angular-manage.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist'));
});

gulp.task('build', ['vendor:fonts', 'vendor:css', 'vendor:js', 'templates', 'scripts']);

gulp.task('serve', function() {
	connect.server({
		port: 8888,
		root: './',
		livereload: true
	});
});
gulp.task('watch', function() {
	gulp.watch(['dist/**/*.*']);
});

gulp.task('default', ['serve', 'watch']);
