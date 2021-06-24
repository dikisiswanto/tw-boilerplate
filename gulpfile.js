/* paths to source files (src),
to ready files (build), as well as to those whose changes need to be monitored (watch) */
const path = {
  build: {
    html: './build/',
    js: './build/assets/js/',
    css: './build/assets/css/',
    img: './build/assets/img/',
    fonts: './build/assets/fonts/',
  },
  src: {
    html: './src/html/pages/*.html',
    js: './src/scripts/main.js',
    css: './src/styles/main.pcss',
    img: './public/images/**/*.*',
    fonts: './public/fonts/**/*.*',
  },
  watch: {
    html: './src/html/**/*.html',
    js: './src/scripts/main.js',
    css: './src/styles/**/*.pcss',
    img: './public/images/**/*.*',
    fonts: './public/fonts/**/*.*',
  },
  clean: './build/*',
};

const config = {
  server: {
    baseDir: './build',
  },
  notify: false,
};

/* include gulp and plugins */
const gulp = require('gulp'); // include Gulp
const webserver = require('browser-sync'); // server for work and automatic page updates
const nunjucks = require('gulp-nunjucks-render'); // nunjucks render to html
const prettyHtml = require('gulp-pretty-html');
const plumber = require('gulp-plumber'); // bug tracking module
const sourcemaps = require('gulp-sourcemaps'); // module for generating a map of source files
const postcss = require('gulp-postcss'); // module for compiling PostCSS (PCSS) to CSS
const autoprefixer = require('gulp-autoprefixer'); // module for automatic installation of auto-prefixes
const cleanCSS = require('gulp-clean-css'); // CSS minification plugin
const uglify = require('gulp-uglify'); // JavaScript minification module
const cache = require('gulp-cache'); // module for caching
const imagemin = require('gulp-imagemin'); // plugin for compressing PNG, JPEG, GIF and SVG images
const jpegrecompress = require('imagemin-jpeg-recompress'); // jpeg compression plugin
const pngquant = require('imagemin-pngquant'); // png compression plugin
const del = require('del'); // plugin for deleting files and directories
const rename = require('gulp-rename');
const browserify = require('browserify'); // plugin for transforming es6+ module
const source = require('vinyl-source-stream'); // stream browserify bundle
const buffer = require('vinyl-buffer'); // bundle into file
const babelify = require('babelify'); // plugin for transpiling es6+ to es5 syntax
const esmify = require('esmify'); // ecmascript transform plugin
const html = require('gulp-htmllint'); // validator html tag

// HTML indent width
const htmlIndentWidth = 2;
// HTML configs for validation
const htmlConfigs = {
  rules: {
    'id-class-style': false,
    'indent-width': htmlIndentWidth,
    'line-end-style': false,
    'title-max-len': false,
    'spec-char-escape': false,
  },
};

/* tasks */

// start the server
gulp.task('webserver', () => {
  webserver(config);
});

// compile html
gulp.task('html:build', (done) => {
  const htmlReport = (filepath, issues) => {
    if (issues.length > 0) {
      issues.forEach((issue) => {
      // eslint-disable-next-line no-console
        console.log('\x1b[31m', `${filepath} [${issue.line},${issue.column}]: (${issue.code}) ${issue.msg}`);
      });
      process.exitCode = 1;
    }
  };

  gulp.src(path.src.html) // selection of all html files in the specified path
    .pipe(plumber()) // error tracking
    .pipe(nunjucks({
      path: ['./src/html/'],
    })) // render nunjucks code into html
    .pipe(prettyHtml({
      indent_size: htmlIndentWidth,
    })) // make html looks clean and pretty
    .pipe(gulp.dest(path.build.html))
    .pipe(html(htmlConfigs, htmlReport)) // check if html tag is valid
    .pipe(webserver.reload({
      stream: true,
    }));
  done();
});

// compile styles
gulp.task('css:build', () => gulp.src(path.src.css) // get main.scss
  .pipe(plumber()) // for bug tracking
  .pipe(postcss()) // pcss -> css
  .pipe(rename({
    basename: 'style',
    extname: '.css',
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
    stream: true,
  })));

// compile js
gulp.task('js:build', () => {
  const b = browserify({
    entries: path.src.js,
    debug: true,
    plugin: [
      [esmify],
    ],
  });

  return b.transform(babelify.configure({
    presets: ['@babel/preset-env'],
  }))
    .bundle()
    .pipe(source('script.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true })) // initialize sourcemap
    .pipe(gulp.dest(path.build.js))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(uglify()) // minimize js
    .pipe(sourcemaps.write('./')) //  write sourcemap
    .pipe(gulp.dest(path.build.js)) // put ready file
    .pipe(webserver.reload({
      stream: true,
    })); // server restart
});

// move fonts
gulp.task('fonts:build', () => gulp.src(path.src.fonts)
  .pipe(gulp.dest(path.build.fonts)));

// image processing
gulp.task('image:build', () => gulp.src(path.src.img) // path to image source
  .pipe(cache(imagemin([ // image compression
    imagemin.gifsicle({
      interlaced: true,
    }),
    jpegrecompress({
      progressive: true,
      max: 90,
      min: 80,
    }),
    pngquant(),
    imagemin.svgo({
      plugins: [{
        removeViewBox: false,
      }],
    }),
  ])))
  .pipe(gulp.dest(path.build.img)));

// remove catalog build
gulp.task('clean:build', () => del(path.clean));

// clear cache
gulp.task('cache:clear', () => {
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
      'image:build',
    )));

// launching tasks when files change
gulp.task('watch', () => {
  gulp.watch(path.watch.html, gulp.series(['html:build', 'css:build']));
  gulp.watch(path.watch.css, gulp.series('css:build'));
  gulp.watch(path.watch.js, gulp.series('js:build'));
  gulp.watch(path.watch.img, gulp.series('image:build'));
  gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
});

// default tasks
gulp.task('default', gulp.series(
  'build',
  gulp.parallel('webserver', 'watch'),
));
