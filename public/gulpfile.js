var gulp = require('gulp'),
	compass = require('gulp-compass'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	//react  = require('gulp-react'),
	babel = require('gulp-babel'),
	minifyCss = require('gulp-minify-css');


gulp.task('sass', function() {
	return gulp.src('src/scss/*.scss')
	  .pipe(compass({
		  config_file: 'config.rb',
		  css: 'stylesheets',
		  sass: 'src/scss/'
		}))
		.pipe(gulp.dest('stylesheets/'));
});

gulp.task('minify-css', function() {
	return gulp.src('stylesheets/*.css')
    	.pipe(minifyCss())
    	.pipe(gulp.dest('stylesheets/'));
});

gulp.task('jsconcat', function () {
	gulp.src([
		'src/js/tools/SimplePubSub.js', 
		'src/js/tools/Notifications.js',
		'src/js/vendor/jquery.js', 
		'src/js/vendor/react.js', 
		'src/js/vendor/underscore.js', 
		'src/js/vendor/backbone.js', 
		'src/js/vendor/moment.js',
		'src/js/vendor/perfect-scrollbar.js'
	])
	.pipe(concat('vendor.js'))
	.pipe(uglify())
	.pipe(gulp.dest('js/'));

	/*
	gulp.src([
		'src/js/app.js'
	])
	.pipe(concat('app.js'))
	.pipe(gulp.dest('src/concat/'));
	*/
	return gulp;
});

gulp.task('js', function() {
	return gulp.src(['src/js/app.js'])
	  //.pipe(react())
	  .pipe(babel({
	   		presets: ['react']
	   }))
	  .pipe(uglify())
	  .pipe(gulp.dest('js/'));
});

gulp.task('jsx', function() {
	return gulp.src(['src/js/react/*.jsx'])
	  .pipe(gulp())
	  .pipe(gulp.dest('js/'));
});

gulp.task('watch', function() {
    gulp.watch('src/scss/*.scss', ['sass']);
    gulp.watch('stylesheets/*.css', ['minify-css']);
    gulp.watch(['src/js/*/*.js', 'src/js/*.js'], ['jsconcat', 'js']);
   // gulp.watch(['src/concat/*.js'], ['js']);
});