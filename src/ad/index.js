/**
 * @file ad 网盟广告组件
 * @author hongfeng(hongfeng@baidu.com)
 */
// TODO: 暂时使用内置模板，下版本升级使用远端回传模板
import {loadScript} from './loader.js';
import './index.css';

const staticParams = {
    adRenderLocked: false,
    adLogVersion: 2
};

function sendLog(ad, logType) {
    let backend = ad.data.get('backend');
    let system;
    let SDKVersion;
    let version;
    if (ad.swan.canIUse('getSystemInfoSync')) {
        let systemInfo = ad.swan.getSystemInfoSync();
        system = systemInfo.system;
        SDKVersion = systemInfo.SDKVersion;
        version = systemInfo.version;
    }
    if (backend === 'zhidao' || backend === 'jingyan') {
        let url = 'https://eclick.baidu.com/se.jpg';
        ad.swan.request({
            url: url,
            data: {
                source: 'miniAPP',
                type: logType,
                backend: backend,
                v: staticParams.adLogVersion,
                osV: system,
                sdkV: SDKVersion,
                hostV: version,
                t: Date.now()
            }
        });
    }
}

export default {
    behaviors: ['userTouchEvents', 'noNativeBehavior'],

    template: `<swan-ad>
        <div class="swan-ad-content"
            on-touchend="onTouchEnd($event)"
            on-touchstart="onTouchStart($event)"
            on-touchmove="onTouchMove($event)"
            s-ref="content"
        >
            <div s-if="rawHtml">
                {{rawHtml | raw}}
            </div>
            <div class="swan-ad-popover{{isMaskShow ? ' swan-ad-popover-show' : ''}}"
                data-event-type="hideMask" on-touchmove="onCloseTouchMove($event)">
                <div s-ref="popBox" class="swan-ad-popover-content-wrapper" style="{{popBoxOffset}}">
                    <div class="swan-ad-popover-content">
                        <div class="swan-ad-popover-arrow" style="left: {{popBoxArrowLeft}}px;
                            {{popDirection ? 'bottom: -3px' : 'top: -3px'}}"></div>
                        <div class="swan-ad-popover-inner">
                            <div class="swan-ad-popover-header">
                                <div class="swan-ad-popover-header-title">选择不喜欢的理由</div>
                                <div class="swan-ad-popover-header-button" data-event-type="feedbackSubmit">
                                    {{feedbackId ? '确定' : '不感兴趣'}}
                                </div>
                            </div>
                            <div class="swan-ad-popover-body">
                                <div s-for="feedback in feedbackList" class="swan-ad-popover-body-reason
                                    {{feedback.selected? 'swan-ad-popover-body-reason-selected' : ''}}"
                                    data-event-type="feedback" data-value="{{feedback.id}}">{{feedback.reason}}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div>{{res}}</div>
    </swan-ad>`,

    initData() {
        return {
            res: ''
        };
    },

    attached() {
        let ad = this;
        sendLog(ad, 'attached');
        let context = 'undefined' !== typeof self ? self : window;
        // 如果当前页面广告请求已经被锁，则等待
        if (staticParams.adRenderLocked) {
            let timer = setInterval(() => {
                if (!staticParams.adRenderLocked) {
                    clearInterval(timer);
                    context.adRender.call(ad, staticParams);
                }
            }, 10);
        }
        else if (context.adRender) {
            context.adRender.call(ad, staticParams);
        }
        // 否则直接检查广告缓存
        else {
            staticParams.adRenderLocked = true;
            let t = new Date().getTime();
            sendLog(ad, 'JSLoading');
            loadScript('https://cpro.baidustatic.com/cpro/xcx/js/ad-render.min.js?t=' + t, function () {
                sendLog(ad, 'JSLoaded');
                staticParams.adRenderLocked = false;
                context.adRender.call(ad, staticParams);
            });
        }
    },

     /**
     * 关闭层禁止滚动
     *
     * @param {Object} evt 事件
     */
    onCloseTouchMove(evt) {
        evt && evt.preventDefault();
    },

    onTap(e) {
        this.onClick(e);
    },

    onClick() {}
};
