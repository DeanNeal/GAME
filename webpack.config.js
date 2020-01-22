const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
// import webpackRxjsExternals from 'webpack-rxjs-externals';
// const webpackRxjsExternals = require('webpack-rxjs-externals');

module.exports = {
    mode: 'development',
    // context: path.resolve(__dirname, './src'),
    entry: {app: './src/main-vue.js', worker: './src/worker.js'},
    output: {
        path: path.resolve(__dirname, './src/public')
        // filename: 'js/bundle.js',
        // publicPath: '/'
    },
    // devServer: {
    //     contentBase: path.resolve(__dirname, './src')
    // },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
              },

            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use: [{
                    loader: 'babel-loader'
                }]
            },

            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: ['css-loader', 'sass-loader']
                })
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                    },
                    loader: 'url-loader',
                    options: {
                        limit: 8000, // Convert images < 8kb to base64 strings
                        name: 'images/[hash]-[name].[ext]'
                    }
                }]
            },
            {
                test: /\.mp3$/,
                // include: SRC,
                loader: 'file-loader'
            },
            // {
            //     test: /\.worker\.js$/,
            //     use: { loader: 'worker-loader' ,  options: { inline: true, fallback: false, publicPath: '/workers/'}}
            // }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: [
        new VueLoaderPlugin(),
        new ExtractTextPlugin('css/main.css')
    ]
};