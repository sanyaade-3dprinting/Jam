/*mish mash between different webpack examples
react hot boilerplate
https://github.com/shanewilson/react-webpack-example/blob/master/webpack.config.js
*/
var fs      = require('fs');
var path    = require('path');
var webpack = require('webpack');
var CompressionPlugin = require("compression-webpack-plugin");


var host    = "localhost";
var port    = 3000;
var srcPath = "src"
var xtraModulesWLoaders = ["js-csp/src"]//add any module names that you want loaders to apply to

var production = process.env.NODE_ENV == 'production';
var dev        = process.env.NODE_ENV == 'dev';


var getSymlinkedModules = function(){

  var rootPath = path.join(__dirname, "node_modules");
  var contents = fs.readdirSync(rootPath);
  var results = contents
  .map(function(entry){
    var fPath  = path.join(rootPath,entry);
    return fPath;
  })
  .filter(function(fPath){
    function check( entry ){
      var stats=fs.lstatSync(fPath);
      return stats.isSymbolicLink();
    }
    return check(fPath);
  })
  .map(function(fPath){
      return fs.realpathSync( fPath );
  });
  return results;
}

//add any extra folders we want to apply loaders to 
var extraModulePaths = xtraModulesWLoaders.map(function(entry){ return path.join(__dirname, "node_modules",entry); });
var pathsToInclude = getSymlinkedModules().concat( path.join(__dirname, srcPath) ).concat( extraModulePaths );

//FIXME !! temporary hack
pathsToInclude.push( path.join(__dirname, "node_modules", "glView-helpers")   )
console.log("will user loaders on",pathsToInclude)

var config= {
  host:host,
  port:port,
  devtool: 'eval',
  entry: [
    './'+srcPath+'/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'+'dist'+'/'
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    //new webpack.optimize.DedupePlugin()
  ],
  module: {
    loaders: [
      { test: /\.json$/,   loader: "json-loader" },
      { test: /-worker*\.js$/, loader: "worker-loader",include : pathsToInclude},//if any module does "require(XXX-worker)" it converts to a web worker
      {test: /\.js?$/,loaders: ['react-hot', 'babel?experimental&optional=runtime'],include : pathsToInclude},
    ],
    noParse: /\.min\.js/
  },
  resolve: {
    extensions: ['', '.js', '.jsx','json'],
    root: [
      path.join(__dirname, "node_modules"),
    ],
    /*alias: {                                                                                    
        "q$":path.join(__dirname, "node_modules","usco-kernel2/src/kernel.js"),//needed only FOR DEV
    }*/
  },
  resolveLoader:{
    root : path.join(__dirname, "node_modules")
  }
};

console.log("production",production,"dev",dev)

if (production) {
  config.bail = true;
  config.debug = false;
  config.profile = false;
  config.output.pathInfo = false;
  //config.devtool = "#source-map";
  //config.output.filename = "[name].[hash].min.js";
  //config.output.chunkFilename = '[id].js';
  config.plugins = config.plugins.concat([
    new webpack.DefinePlugin({'process.env': {'NODE_ENV': JSON.stringify('production') } }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: {
        except: ['require', 'export', '$super', 'import']
      },
      compress: {
        warnings: false,
        sequences: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true,
        drop_console: true
      }
    }),
    new CompressionPlugin({
      asset: "{file}.gz",
      algorithm: "gzip",
      regExp: /\.js$|\.html$/,
      threshold: 10240,
      minRatio: 0.8
    })
  ]);
}
else{
  config.entry = config.entry.concat([
    'webpack-dev-server/client?',//http://'+host+":"+port,
    'webpack/hot/only-dev-server',
  ])
  config.plugins = config.plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
  ])


}






module.exports = config;
