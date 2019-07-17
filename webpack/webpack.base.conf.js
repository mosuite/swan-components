/**
 * @file base webpack config
 * @author houyu(houyu01@baidu.com), yanghuabei(yanghuabei@baidu.com)
 */
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    plugins: [
        new ExtractTextPlugin({
            filename: 'styles_[name].css',
            allChunks: false
        })
    ],
    module: {
        rules: [
            {
                test: /\.js?$/,
                loader: 'babel-loader'
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader?modules&localIdentName=[local]'
                })
            },
            {
                test: /\.styl$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                modules: true,
                                localIdentName: '[local]'
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [
                                    require('autoprefixer')()
                                ]
                            }
                        },
                        'stylus-loader'
                    ]
                })
            },
            {
                test: /\.(png|jpg|ttf|woff|eot|svg)$/,
                loader: 'url-loader'
            },
            {
                test: /\.(html|tpl)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        minimize: false
                    }
                }
            }
        ]
    }
};
