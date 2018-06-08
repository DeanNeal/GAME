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
                test: /\.worker\.js$/,
                use: { loader: 'worker-loader' ,  options: { inline: true, fallback: false, publicPath: '/workers/'}}
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