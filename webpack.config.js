const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// import webpackRxjsExternals from 'webpack-rxjs-externals';
// const webpackRxjsExternals = require('webpack-rxjs-externals');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: './app.jsx',
    output: {
        path: path.resolve(__dirname, './public'),
        filename: 'js/bundle.js',
        // publicPath: '/'
    },
    // devServer: {
    //     contentBase: path.resolve(__dirname, './src')
    // },
    module: {
        rules: [{
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },

            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use: [{
                    loader: 'babel-loader'
                }]
            },
            {
                test: /\.jsx$/,
                exclude: [/node_modules/],
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['react']
                    }
                }]
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: ['css-loader', 'sass-loader']
                })
            }
        ]
    },
    // externals: [
    //   webpackRxjsExternals(),
    //   // other externals here
    // ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
    plugins: [
        new ExtractTextPlugin('css/main.css')
    ]
};