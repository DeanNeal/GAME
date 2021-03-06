const path = require('path');
// const webpack = require('webpack');
// const ExtractTextPlugin = require('extract-text-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// import webpackRxjsExternals from 'webpack-rxjs-externals';
// const webpackRxjsExternals = require('webpack-rxjs-externals');

module.exports = {
    mode: 'development',
    entry: {app: './client/main-vue.js', worker: './client/worker/worker.ts'},
    output: {
        path: path.join(__dirname, './public')
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
                test: /\.(less)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "less-loader"
                ]
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
        new MiniCssExtractPlugin({
			filename: "css/[name].css",
			// chunkFilename: "[id].css"
		})
    ]
};