'use strict'
const merge = require('webpack-merge');
const webpack = require('webpack');
const baseWebpackConfig = require('./webpack.base.conf');

process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

module.exports = merge({
    // 剔除base里css loader的配置
    customizeObject(a, b, key) {
        if (key === 'module') {
            const rules = a.rules.filter(({test}) => !test.test('style.css'));
            return {rules: [...rules, ...b.rules]};
        }
    }
})(
    baseWebpackConfig,
    {
        resolve: {
            alias: {
                '@baidu/swan-components': '../src/index.js'
            }
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        {loader: 'style-loader'},
                        {
                            loader: 'css-loader',
                            options: {
                                modules: true,
                                localIdentName: '[local]'
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: 'test'
                }
            })
        ]
    }
);
