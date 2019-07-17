/**
 * @file karma配置文件
 * @author liuyuekeng@baidu.com
 */

const webpackConfig = require('../webpack/webpack.test.conf');

module.exports = function (config) {
    config.set({
        browsers: ['NoSandboxChromeHeadless'],
        captureTimeout: 60000,
        customLaunchers: {
            NoSandboxChromeHeadless: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox']
            }
        },
        frameworks: ['jasmine'],
        port: 9876,
        colors: true,
        autoWatch: true,

        files: [
            // karma入口文件，入口文件太多会拖慢单测
            // 对于常规组件，只需要放到entry.js中，对于camera等需要放多个页面跑的才弄成多入口
            './components/entry.js',
            './components/page/*.js',
            './components/ar-camera/*.js',
            './components/camera/*.js'
        ],
        preprocessors: {
            '../test/**/*.js': ['webpack']
        },
        webpack: webpackConfig,
        webpackMiddleware: {
            stats: 'errors-only'
        },
        reporters: ['coverage', 'html'],
        htmlReporter: {
            outputDir: './test', // where to put the reports
            reportName: 'report' // report summary filename; browser info by default
        },
        coverageReporter: {
            dir: '../test/coverage',
            reporters: [{
                    type: 'lcov',
                    subdir: '.'
                },
                {
                    type: 'text-summary'
                }
            ]
        },
        singleRun: true,
        concurrency: Infinity,
        captureTimeout: 210000,
        browserDisconnectTolerance: 3,
        browserDisconnectTimeout: 210000,
        browserNoActivityTimeout: 210000
    });
};
