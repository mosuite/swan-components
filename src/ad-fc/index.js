/**
 * @file ad 凤巢广告组件，目前用于搜索合作页
 * @author wukaifang(wukaifang@baidu.com)
 */

import './index.css';

import {fclick, request} from './ecom';
import {privateKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

// swan不建议直接在组件使用window，这里先参考其他组件写法，@houxu01
const global = window;

// 支持的html域名白名单
const allowedHosts = [
    'mipengine.baidu.com',
    'edu.baidu.com',
    'zhaopin.baidu.com'
];

export default {
    // behaviors: ['noNativeBehavior'],
    behaviors: ['userTouchEvents'],
    constructor() {
        this.requestTask = null;
        this.timer = null;

        this.handleClick = this.handleClick.bind(this);
        this.handleAdClick = this.handleAdClick.bind(this);
        this.handleExposure = this.handleExposure.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
    },

    template: `<swan-ad-fc>
        <div s-ref="adFcEle" class="swan-ad-fc-content">
            <div s-if="provideData.rawHtml">
                {{provideData.rawHtml | raw}}
            </div>
        </div>
    </swan-ad-fc>`,

    initData() {
        return {
            [privateKey]: {
                rawHtml: ''
            }
        };
    },

    computed: {

        /**
         * 创建私有属性，供模板使用
         *
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        },
        ...internalDataComputedCreator([
            {name: 'source', caster: typesCast.stringCast},
            // default作为key，fecs会报需要加引号问题
            /* eslint-disable fecs-properties-quote */
            {name: 'cookie', default: '', caster: typesCast.stringCast},
            {name: 'disableDefaultBehavior', default: false, caster: typesCast.boolCast}
            /* eslint-enable fecs-properties-quote */
        ])
    },

    created() {
        this.loadHtml();
    },

    attached() {
        this.watch('source', source => {
            this.loadHtml();
        });
        global.addEventListener('scroll', this.handleScroll, false);
    },

    detached() {
        if (this.requestTask) {
            this.requestTask.abort();
        }
        this.data.set(`${privateKey}.rawHtml`, '');

        // dom元素移除 事件自动卸载
        // this.operateEventListener();
        // this.operateAdEventListener();

        global.removeEventListener('scroll', this.handleScroll, false);
    },

    // updated(data) {
    //     // console.log('updated', data);
    // },

    // slaveRenderd(data) {
    //     // console.log('slaveRenderd', data);
    // },

    /**
     * 开始载入html
     */
    loadHtml() {
        let source = this.data.get('__source');
        if (!source) {
            this.dispatchEvent('binderror', {
                detail: {
                    type: 'validation',
                    err: 'source不能为空'
                }
            });
            return;
        }

        // 提取域名，source必须是带上域名的，那么第三个就是域名
        let urlItems = source.split('/');
        if (urlItems.length >= 3 && allowedHosts.indexOf(urlItems[2]) > -1) {
            this.downloadHtml(source);
        }
        else {
            this.dispatchEvent('binderror', {
                detail: {
                    type: 'validation',
                    err: 'source的域名仅支持: ' + allowedHosts.join(', ')
                }
            });
        }
    },

    /**
     * 点击用户普通元素
     *
     * @param {Event} e 点击事件
     */
    handleClick(e) {
        e.preventDefault();

        let dataset = e.currentTarget.dataset;
        let classList = e.currentTarget.classList;
        // 仅提供这些原始元素的数据
        let data = {
            classList: Array.from(classList),
            dataset: dataset
        };

        // 支持自定义点击，透传到用户程序层
        if (classList.contains('swan-ad-fc-click')) {
            this.dispatchEvent('bindtap', {
                detail: data
            });
        }

        // 支持打开一个url
        if (
            !this.data.get('__disableDefaultBehavior')
            && classList.contains('swan-ad-fc-redirect')
            && data.dataset.redirect
        ) {
            this.boxjs.ui.open({
                name: 'swan-adWebPage',
                data: {
                    url: data.dataset.redirect
                }
            });
        }

        // 支持调起电话
        if (
            !this.data.get('__disableDefaultBehavior')
            && classList.contains('swan-ad-fc-phone')
            && data.dataset.phone
        ) {
            this.swan.makePhoneCall({
                phoneNumber: data.dataset.phone
            });
        }
    },

    /**
     * 点击广告元素
     *
     * @param {Event} e 点击事件
     */
    handleAdClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // 广告点击支持 特定class
        let href = e.currentTarget.getAttribute('href');
        const dataset = e.currentTarget.dataset;

        // 电话吊起支持 电话号码不是电话协议
        if (dataset.cal) {
            // 异步计费请求
            request(dataset.rcv);

            this.swan.makePhoneCall({
                phoneNumber: dataset.cal
            });
        }
        else if (href) {
            this.boxjs.ui.open({
                name: 'swan-adWebPage',
                data: {
                    url: href
                }
            });

            // 计费链接判断 & @TODO 增加ck反作弊
            href.indexOf('/baidu.php?') === -1 && this.dispatchEvent('bindlog', {
                message: 'not charge url',
                href
            });
        }
    },

    /**
     * 特殊针对广告元素，在每次渲染完html后，执行移除事件，并根据参数绑定事件等操作
     *
     * @param {boolean} addFlag 是否绑定事件
     */
    operateAdEventListener(addFlag) {
        let eles = this.ref('adFcEle').querySelectorAll('.ec-fc-click');
        let len = eles.length;
        for (let i = 0; i < len; i++) {
            let item = eles[i];
            item.removeEventListener('click', this.handleAdClick);
            if (addFlag) {
                item.addEventListener('click', this.handleAdClick);
            }
        }

        this.handleExposure();
    },

    /**
     * 在每次渲染完html后，执行移除事件，并根据参数绑定事件等操作
     *
     * @param {boolean} addFlag 是否绑定事件
     */
    operateEventListener(addFlag) {
        let eles = this.ref('adFcEle').querySelectorAll(
            '.swan-ad-fc-click, .swan-ad-fc-redirect, .swan-ad-fc-phone, a'
        );
        // Fix: eles元素列表和数组迭代方式不一定一致
        // 比如在ios9，eles元素列表的Symbol.iterator和forEach就不支持，只能使用for语法
        let len = eles.length;
        for (let i = 0; i < len; i++) {
            let item = eles[i];
            item.removeEventListener('click', this.handleClick);
            if (addFlag) {
                item.addEventListener('click', this.handleClick);
            }
        }
    },

    /**
     * 验证下载的html是否符合规范
     * 由于已经限制了访问域名，这里只简单判断下，并不是很严谨
     *
     * @param {string} html html内容
     * @return {boolean} 通过为true，否则返回false
     */
    validateHtml(html) {
        // 不允许html等标签
        let matchRes = /<(html|head|body|meta|script)[\s\S]*?>/.exec(html);
        if (matchRes) {
            return `Don't allow the '${matchRes[1]}' tag`;
        }

        // 不允许元素里有 onclick等属性，简单暴力 on开头的属性都不允许
        if (/<[\w-]+? [\s\S]*?on[a-zA-Z]+=['"]([\W|\w]*?)['"][\s\S]*?>/gi.test(html)) {
            return 'Don\'t allow all of attributes beginning with "on" tag';
        }
    },

    /**
     * 滑屏监控
     */
    handleScroll() {
        clearTimeout(this.timer);
        this.timer = setTimeout(this.handleExposure, 0);
    },

    /**
     * 曝光监控
     */
    handleExposure() {
        let elem;
        let winHeight = global.innerHeight;
        let adShowList = document.querySelectorAll('[ad-fc-show]');

        for (let i = 0, len = adShowList.length; i < len; i++) {
            elem = adShowList[i];

            // 曝光一次
            if (parseInt(elem.getAttribute('data-has-show'), 10) === 1) {
                continue;
            }

            let elemTop = elem.getBoundingClientRect().top;

            if (elemTop < winHeight) {
                let log = JSON.parse(elem.getAttribute('ad-fc-show') || {});

                fclick(log);

                this.dispatchEvent('bindscroll', {log});
                elem.setAttribute('data-has-show', 1);
            }
        }
    },

    /**
     * html下载成功的回调，插入dom并开始绑定事件
     *
     * @param {string} html html内容
     */
    downloadSuccess(html) {
        this.dispatchEvent('bindloaded');
        let err = this.validateHtml(html);
        if (err) {
            this.dispatchEvent('binderror', {
                detail: {
                    type: 'validation',
                    err
                }
            });
            return;
        }
        this.data.set(`${privateKey}.rawHtml`, html);
        this.nextTick(() => {
            this.operateEventListener(true);
            this.operateAdEventListener(true);
            this.dispatchEvent('bindrendered');
        });
    },

    /**
     * 下载html
     *
     * @param {Object} source html请求地址
     */
    downloadHtml(source) {
        let self = this;
        let startTime = new Date().getTime();

        this.dispatchEvent('bindwillLoad');

        this.requestTask = this.swan.request({
            url: source,
            method: 'GET',
            dataType: 'string',
            header: {
                cookie: this.data.get('__cookie')
                // /'content-type': 'application/json' // 默认值
            },
            success: res => {
                self.requestTask = null;

                // 统计各业务线请求url及相关信息
                fclick({
                    tag: 'ecom_msa_tmp_3',
                    action: 'smart_app_request',
                    url: source,
                    time: new Date().getTime() - startTime
                });

                if (res.statusCode === 200) {
                    self.downloadSuccess(res.data);
                }
                else {
                    this.dispatchEvent('binderror', {
                        detail: {
                            type: 'response',
                            err: res
                        }
                    });
                }
            },
            fail: err => {
                self.requestTask = null;

                // 统计各业务线请求url及相关信息
                fclick({
                    tag: 'ecom_msa_tmp_3',
                    action: 'smart_app_request_error',
                    url: source,
                    error: JSON.stringify(err)
                });

                this.dispatchEvent('binderror', {
                    detail: {
                        type: 'request',
                        err: err
                    }
                });
            }
        });
    }
};
