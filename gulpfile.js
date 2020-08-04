const gulp = require('gulp');
const postcss = require('gulp-postcss');
const concat = require('gulp-concat');
const nunjucks = require('gulp-nunjucks-render');
const purgecss = require('gulp-purgecss');
const prettyHtml = require('gulp-pretty-html');
const prettyCss = require('gulp-clean-css');
const prettyJs = require('gulp-minify');
const babel = require('gulp-babel');

gulp.task('css', () => {
	const buildCss = gulp.src('./src/main.pcss')
		.pipe(postcss())
		.pipe(concat('style.css'))
		.pipe(gulp.dest('./public/assets/css'))
		.pipe(purgecss({
			content: ['public/*.html']
		}))
		.pipe(prettyCss())
		.pipe(concat('style.min.css'))
		.pipe(gulp.dest('./public/assets/css/'));
	return buildCss;
})

gulp.task('html', () => {
	const buildHtml = gulp.src('./src/pages/*.html')
		.pipe(nunjucks({
			path: ['./src/']
		}))
		.pipe(prettyHtml({
			indent_size: 1,
			indent_with_tabs: true
		}))
		.pipe(gulp.dest('./public/'));
	return buildHtml
});

gulp.task('js', () => {
	const buildJs = gulp.src('./src/scripts/main.js')
		.pipe(concat('script.js'))
		.pipe(babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(gulp.dest('./public/assets/js/'))
		.pipe(prettyJs())
		.pipe(gulp.dest('./public/assets/js/'))
	return buildJs;
})

gulp.task('watch', () => {
	gulp.watch('./src/**/*.html', gulp.series('html'));
	gulp.watch('./src/**/*.pcss', gulp.series('css'));
	gulp.watch('./src/**/*.js', gulp.series('js'));
})