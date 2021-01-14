/* paths to source files (src), to ready files (build), as well as to those whose changes need to be monitored (watch) */
const path = {
  build: {
    html: './build/',
    js: './build/assets/js/',
    css: './build/assets/css/',
    img: './build/assets/img/',
    fonts: './build/assets/fonts/'
  },
  src: {
    html: './src/html/pages/*.html',
    js: './src/scripts/main.js',
    css: './src/styles/main.pcss',
    img: './public/images/**/*.*',
    fonts: './public/fonts/**/*.*'
  },
  watch: {
    html: './src/html/**/*.html',
    js: './src/scripts/main.js',
    css: './src/styles/**/*.pcss',
    img: './public/images/**/*.*',
    fonts: './public/fonts/**/*.*'
  },
  clean: './build/*'
};

const config = {
  server: {
    baseDir: './build'
  },
  notify: false
};

/* include gulp and plugins */
const gulp = require('gulp'); // include Gulp
const webserver = require('browser-sync'); // server for work and automatic page updates
const nunjucks = require('gulp-nunjucks-render'); // nunjucks render to html
const prettyHtml = require('gulp-pretty-html');
const plumber = require('gulp-plumber'); // bug tracking module
const include = require('gulp-include'); // a module to import the contents of one file into another
const sourcemaps = require('gulp-sourcemaps'); // module for generating a map of source files
const postcss = require('gulp-postcss'); // module for compiling PostCSS (PCSS) to CSS
const autoprefixer = require('gulp-autoprefixer'); // module for automatic installation of auto-prefixes
const cleanCSS = require('gulp-clean-css'); // CSS minification plugin
const uglify = require('gulp-uglify'); // JavaScript minification module
const babel = require('gulp-babel'); // converting js modules to es5 syntax
const cache = require('gulp-cache'); // module for caching
const imagemin = require('gulp-imagemin'); // plugin for compressing PNG, JPEG, GIF and SVG images
const jpegrecompress = require('imagemin-jpeg-recompress'); // jpeg compression plugin
const pngquant = require('imagemin-pngquant'); // png compression plugin
const del = require('del'); // plugin for deleting files and directories
const rename = require('gulp-rename');

/* tasks */

// start the server
gulp.task('webserver', function () {
  webserver(config);
});

// compile html
gulp.task('html:build', function () {
  return gulp.src(path.src.html) // selection of all html files in the specified path
    .pipe(plumber()) // error tracking
    .pipe(nunjucks({
      path: ['./src/html/'],
    })) // render nunjucks code into html
    .pipe(prettyHtml()) // make html looks clean and pretty
    .pipe(gulp.dest(path.build.html)) // uploading ready files
    .pipe(webserver.reload({
      stream: true
    })); // server reboot
});

// compile styles
gulp.task('css:build', function () {
  return gulp.src(path.src.css) // get main.scss
    .pipe(plumber()) // for bug tracking
    .pipe(postcss()) // pcss -> css
    .pipe(rename({
      basename: 'style',
      extname: '.css'
    }))
    .pipe(gulp.dest(path.build.css))
    .pipe(sourcemaps.init()) // initialize sourcemap
    .pipe(autoprefixer()) // add prefix
    .pipe(gulp.dest(path.build.css))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(cleanCSS()) // minimize CSS
    .pipe(sourcemaps.write('./')) // write sourcemap
    .pipe(gulp.dest(path.build.css)) // output to build
    .pipe(webserver.reload({
      stream: true
    })); // server restart
});

// compile js
gulp.task('js:build', function () {
  return gulp.src(path.src.js) // get file main.js
    .pipe(plumber()) // for bug tracking
    .pipe(include()) // import all files to main.js
    .pipe(babel({
      presets: ['@babel/preset-env']
    })) // babel convert to es5
    .pipe(rename({
      basename: 'script',
    }))
    .pipe(gulp.dest(path.build.js))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(sourcemaps.init()) //initialize sourcemap
    .pipe(uglify()) // minimize js
    .pipe(sourcemaps.write('./')) //  write sourcemap
    .pipe(gulp.dest(path.build.js)) // put ready file
    .pipe(webserver.reload({
      stream: true
    })); // server restart
});

// move fonts
gulp.task('fonts:build', function () {
  return gulp.src(path.src.fonts)
    .pipe(gulp.dest(path.build.fonts));
});

// image processing
gulp.task('image:build', function () {
  return gulp.src(path.src.img) // path to image source
    .pipe(cache(imagemin([ // image compression
      imagemin.gifsicle({
        interlaced: true
      }),
      jpegrecompress({
        progressive: true,
        max: 90,
        min: 80
      }),
      pngquant(),
      imagemin.svgo({
        plugins: [{
          removeViewBox: false
        }]
      })
    ])))
    .pipe(gulp.dest(path.build.img)); // output ready files
});

// remove catalog build
gulp.task('clean:build', function () {
  return del(path.clean);
});

// clear cache
gulp.task('cache:clear', function () {
  cache.clearAll();
});

// assembly
gulp.task('build',
  gulp.series('clean:build',
    gulp.parallel(
      'html:build',
      'css:build',
      'js:build',
      'fonts:build',
      'image:build'
    )
  )
);

// launching tasks when files change
gulp.task('watch', function () {
  gulp.watch(path.watch.html, gulp.series('html:build'));
  gulp.watch(path.watch.css, gulp.series('css:build'));
  gulp.watch(path.watch.js, gulp.series('js:build'));
  gulp.watch(path.watch.img, gulp.series('image:build'));
  gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
});

// default tasks
gulp.task('default', gulp.series(
  'build',
  gulp.parallel('webserver', 'watch')
));