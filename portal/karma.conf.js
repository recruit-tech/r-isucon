// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      { pattern: './src/test.ts', watched: false }
    ],
    preprocessors: {
      './src/test.ts': ['webpack', 'coverage']
    },
    webpack: {
      devtool: 'inline-source-map',
      resolve: {
        extensions: ['.ts', '.js', '.css', '.html']
      },
      module: {
        loaders: [
          {
            test: /\.ts$/,
            loaders: ['istanbul-instrumenter-loader', 'awesome-typescript', 'angular2-template-loader']
          },
          {
            test: /\.css$/,
            loader: 'raw',
            exclude: './src'
          },
          {
            test: /\.html$/,
            loader: 'raw',
            exclude: ['src/index.html']
          }
        ]
      }
    },
    webpackMiddleware: {
      stats: 'errors-only'
    },
    webpackServer: {
      noInfo: true
    },
    coverageReporter: {
      type: 'in-memory'
    },
    remapOptions: {
      exclude: /(node_modules|spec\.ts|test\.ts)/
    },
    remapCoverageReporter: {
      'text-summary': null,
      html: './artifacts/coverage/lcov-report',
      lcovonly: './artifacts/coverage/lcov.info'
    },
    reporters: ['progress', 'coverage', 'remap-coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};
