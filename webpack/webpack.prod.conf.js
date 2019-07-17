/**
 * @file webpack config for production
 * @author yanghuabei@baidu.com
 */

'use strict'
const merge = require('webpack-merge');
const webpack = require('webpack');
const path = require('path');
const baseWebpackConfig = require('./webpack.base.conf');

const root = pathRelativeToRoot => path.resolve(__dirname, '..', pathRelativeToRoot);

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

module.exports = merge(
    baseWebpackConfig,
    {
        entry: {
            'index': root('src/index.js'),
            'master-inject': root('src/master-inject.js')
        },
        output: {
            path: root('dist/'),
            filename: '[name].js',
            libraryTarget: 'umd'
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: 'production'
                }
            }),
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false
            }),
            new webpack.optimize.UglifyJsPlugin({
                // sourceMap: true,
                compress: {
                    warnings: false,
                    /* eslint-disable fecs-camelcase */
                    drop_console: false
                    /* eslint-disable fecs-camelcase */
                },
                comments: false
            })
        ]
    }
);
