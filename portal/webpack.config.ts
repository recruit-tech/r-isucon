var webpack = require('webpack');
var path = require('path');
var clone = require('js.clone');
var webpackMerge = require('webpack-merge');
var extractTextPlugin = require('extract-text-webpack-plugin');

var ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development';

// 環境変数がない場合は、現在時刻が開催時刻となり、終了時刻は7日後となる
var now = Date.now();
var START_DATE = isNaN(Date.parse(process.env.START_DATE)) ? new Date() : process.env.START_DATE;
var END_DATE = isNaN(Date.parse(process.env.END_DATE)) ? new Date(now + 7 * 24 * 60 * 60 * 1000) : process.env.END_DATE;


export var commonPlugins = [
  new webpack.ContextReplacementPlugin(
    // The (\\|\/) piece accounts for path separators in *nix and Windows
    /angular(\\|\/)core(\\|\/)src(\\|\/)linker/,
    root('./src'),
    {
      // your Angular Async Route paths relative to this root directory
    }
  ),

  // Loader options
  new webpack.LoaderOptionsPlugin({

  }),

  new webpack.DefinePlugin({
    'process.env.NODE_ENV':  JSON.stringify(ENV),
    'process.env.AOT': false,
    'process.env.START_DATE': JSON.stringify(START_DATE),
    'process.env.END_DATE': JSON.stringify(END_DATE),
  }),

];

export var commonConfig = {
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    modules: [ root('node_modules') ]
  },
  context: __dirname,
  output: {
    publicPath: '',
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      // TypeScript
      { test: /\.ts$/, use: ['awesome-typescript-loader', 'angular2-template-loader'] },
      { test: /\.html$/, use: 'raw-loader' },
      { test: /\.css$/, use: [
        extractTextPlugin.extract({ fallbackLoader: 'style-loader', loader: 'css-loader' }),
        'to-string-loader',
        'css-loader'
      ], include: [/node_modules/, /global.css/]},
      { test: /\.css$/, use: ['to-string-loader', 'css-loader'], exclude: [/node_modules/, /global.css/]},
      { test: /\.json$/, use: 'json-loader' }
    ],
  },
  plugins: [
    // Use commonPlugins.
    new extractTextPlugin({ filename: 'styles.css', disable: false, allChunks: true })
  ]

};

// Client.
export var clientPlugins = [

];

export var clientConfig = {
  target: 'web',
  entry: './src/client',
  output: {
    path: root('dist/client')
  },
  node: {
    global: true,
    crypto: 'empty',
    __dirname: true,
    __filename: true,
    process: true,
    Buffer: false
  },
  module: {
    rules: [
      { test: require.resolve("material-design-lite/material"), use: 'exports-loader?componentHandler' }
    ],
  },
};

// Server.
export var serverPlugins = [

];

export var serverConfig = {
  target: 'node',
  entry: './src/server', // use the entry file of the node server if everything is ts rather than es5
  output: {
    path: root('dist/server'),
    libraryTarget: 'commonjs2',
    filename: 'index.js'
  },


  module: {
    rules: [
      { test: /@angular(\\|\/)material/, use: 'imports-loader?window=>global' }
    ],
  },

  externals: includeClientPackages(
    /@angularclass|@angular|angular2-|ng2-|ng-|@ng-|angular-|@ngrx|ngrx-|@angular2|ionic|@ionic|-angular2|-ng2|-ng|-loader/
  ),
  node: {
    global: true,
    crypto: 'empty',
    __dirname: true,
    __filename: true,
    process: true,
    Buffer: true
  }
};


export default [
  // Client
  webpackMerge(clone(commonConfig), clientConfig, { plugins: clientPlugins.concat(commonPlugins) }),

  // Server
  webpackMerge(clone(commonConfig), serverConfig, { plugins: serverPlugins.concat(commonPlugins) })
];


// Helpers
export function includeClientPackages(packages, localModule?: string[]) {
  return function(context, request, cb) {
    if (localModule instanceof RegExp && localModule.test(request)) {
      return cb();
    }
    if (packages instanceof RegExp && packages.test(request)) {
      return cb();
    }
    if (Array.isArray(packages) && packages.indexOf(request) !== -1) {
      return cb();
    }
    if (!path.isAbsolute(request) && request.charAt(0) !== '.') {
      return cb(null, 'commonjs ' + request);
    }
    return cb();
  };
}

export function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [__dirname].concat(args));
}
