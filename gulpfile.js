'use strict';

var gulp = require('gulp');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer-core');
var browserSync = require('browser-sync').create();
var compass = require('gulp-compass');
var minifyCss = require('gulp-minify-css');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var merge = require('merge-stream');
var spritesmith = require('gulp.spritesmith');

// Static Server + watching scss/html files
gulp.task('serve', ['css'], function() {

    browserSync.init({
        server: "./"
    });

    gulp.watch("scss/sass/*.scss", ['css']);
    gulp.watch("img/*", ['imagemin']);
    gulp.watch("js/*.js", ['js']).on('change', browserSync.reload);
    gulp.watch(["*.html"]).on('change', browserSync.reload);
});

// Compile sass into CSS
gulp.task('compass', ['sprite'], function() {
    return gulp.src('scss/*.scss')
        .pipe(compass({
            config_file: 'scss/config.rb',
            sass: 'scss',
            comments: true,
            sourcemap: true
        }))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.stream());
});

// Autoprefix and minify css file & auto-inject into browsers
gulp.task('css', ['compass'], function () {
    return gulp.src(['css/*.css'])
        .pipe(postcss([ autoprefixer({ browsers: ['> 1%'], cascade: false }) ]))
        .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(minifyCss())
        .pipe(sourcemaps.write())
        .pipe(rename('bundle.min.css'))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.stream());
});

// Concat all .js files and uglify it
gulp.task('js', function () {
    return gulp.src(['js/vendor/jquery-1.11.2.min.js', 'js/vendor/*.js', 'js/*.js'])
    .pipe(sourcemaps.init())
        .pipe(concat('all.js'))
        .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(rename('scripts.min.js'))
    .pipe(gulp.dest('app/js'));
});

// Image minimization
gulp.task('imagemin', function () {
    return gulp.src('img/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('app/img'));
});

// Generating sprite
gulp.task('sprite', ['imagemin'], function () {
  // Generate our spritesheet
  var spriteData = gulp.src('app/img/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.scss'
  }));

  // Pipe image stream through image optimizer and onto disk
  var imgStream = spriteData.img
    .pipe(imagemin())
    .pipe(gulp.dest('app/img/sprite'));

  // Pipe CSS stream through CSS optimizer and onto disk
  var cssStream = spriteData.css
    .pipe(gulp.dest('scss/sass'));

  // Return a merged stream to handle both `end` events
  return merge(imgStream, cssStream);
});

// Sprite
gulp.task('sprite', function () {
    var spriteData = gulp.src('app/images/sprite/*.*')
        .pipe(spritesmith({
            imgName: 'sprite.png',
            imgPath: '../images/sprite.png',
            cssName: '_sprite.scss',
            cssFormat: 'scss',
            algorithm: 'left-right',
        }));

    spriteData.img.pipe(gulp.dest('app/images/'));
    spriteData.css.pipe(gulp.dest('app/scss/'));
});

gulp.task('watch', function() {
    gulp.watch(['css/*.css'], ['css']);
    gulp.watch(['js/*.js'], ['js']);
});

// Build
gulp.task('build', ['clean', 'sprite', 'scss'], function () {
    var assets = useref.assets();
    
    gulp.src([
        'app/**/.htaccess',
        'app/**/*.*',
        '!app/*.html',
        '!app/scss/**/*.*',
        '!app/css/**/*.*',
        '!app/js/**/*.js'
    ]).pipe(gulp.dest('dist'));
    
    return gulp.src('app/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['css']);