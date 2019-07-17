/**
 * @file bdml's file's base elements <cover-image>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import style from './index.css';
import {isEqualObject, getTransitionParams, privateKey, absolutePathResolver} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {STABILITY_LOG_CONFIG} from '../utils/constant';
import {handleVideoFullscreenChangeMessage} from '../utils/na-comp';

export default {

    behaviors: ['nativeEventEffect', 'nativeCover'],

    /**
     * computed 节点用来生成 transition 动画的参数
     */
    template: `<swan-cover-image data-sanid="{{provideData.componentId}}"
        src="{{src}}">
        <img s-ref="img"
            src="{{provideData.src}}"
            style="width: {{provideData.isLoaded ? '100%' : 'auto'}}" />
        <div s-ref="computed"
            class="{{'computed ' + (class ? class : '')}}"
            style="{{style}}"></div>
    </swan-cover-image>`,

    constructor(props) {
        this.isInserted = false;
        this.args = null;
        this.isLoaded = false;
        this.src = null;
    },

    initData() {
        return {
            hidden: false,
            id: this.id,
            [privateKey]: {
                componentId: this.id,
                src: null,
                isLoaded: false
            }
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'src', caster: typesCast.stringCast}
        ]),

        /**
         * 创建私有属性，供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },

    created() {
        this.nextTick(() => {
            // cover-image 的 dom 节点本身不用响应 transition 动画，在插入贴片前需要设置 transition-property 为 none
            this.el && ['transition-property', '-webkit-transition-property'].forEach(key => {
                this.el.style.setProperty(key, 'none', 'important');
            });
            this.insertNativeCoverImage();
        });
    },

    attached() {
        this.communicator.onMessage('fullscreenchange', message => {
            // 对于 ios 同层渲染，全屏时候需要把其它非本视频的 na 组件隐藏掉
            handleVideoFullscreenChangeMessage(this, message);

            this.updateNativeCoverImage();
        });
        // 响应客户端派发到 slave 的事件
        this.communicator.onMessage(`coverImage_${this.data.get('id')}`, event => {
            this.dispatchNaEvent(event.params.action, event.params.e);
        });
    },

    detached() {
        this.removeNativeCoverImage();
    },

    /**
     * slaveUpdated
     *
     * @override
     */
    slaveUpdated() {
        this.updateNativeCoverImage();
    },

    /**
     * 派发图片加载状态是否成功的消息
     * @param {Object} data 二级回调产出的数据集合
     */
    onLoad(data) {
        let eventType = ({
            finish: {type: 'load', bind: 'bindload'},
            error: {type: 'error', bind: 'binderror'}
        })[data.loadState];
        eventType.type === 'error' && this.logStability(STABILITY_LOG_CONFIG.coverImageBindError);
        eventType && this.dispatchEvent(eventType.bind, {
            detail: {}
        });
    },

    /**
     * 判断开发者是否绑定过 bindload 或者 binderror
     * @return {boolean} 是否绑定过 bindload 或者 binderror
     */
    hasLoadListener() {
        return !!(this.listeners.bindload || this.listeners.binderror);
    },

    /**
     * 创建发送端能力所需的参数
     * @return {Object} 端能力所需的参数
     */
    getCoverImageParams() {
        const self = this;
        const src = this.getAbsoluteImgPath();
        return {
            ...this.getParams(),
            viewId: `${this.data.get('id')}`,
            src,
            loadState: this.hasLoadListener(),
            callback(res) {
                const resObj = JSON.parse(res);
                const data = resObj.data || {};
                data.type = data.type || 'click';
                switch (data.type) {
                    case 'loadState': {
                        self.onLoad(data);
                        break;
                    }
                }
            }
        };
    },

    /**
     * 插入 NA 视图
     */
    insertNativeCoverImage() {
        if (this.el) {
            this.preLoadImg().finally(() => {
                this.nextTick(() => {
                    const params = this.getCoverImageParams();
                    this.isInserted = true;
                    this.args = {
                        ...params
                    };
                    this.insertNativeCover({
                        name: 'coverImage',
                        params
                    }).then(() => {
                        // 通知其它组件需要更新 NA 视图
                        this.updateOtherComponents();
                    }).catch(() => {
                        this.isInserted = false;
                        this.args = null;
                        this.logStability(STABILITY_LOG_CONFIG.coverImageInsertError);
                    });
                });
            }).catch(e => {
                console.warn(e);
            });
        }
    },

    /**
     * 修改 NA 视图
     */
    updateNativeCoverImage() {
        const afterImgLoaded = () => {
            const params = this.getCoverImageParams();
            const originArgs = {
                ...this.args
            };
            if (!isEqualObject(params, this.args)) {
                this.args = {
                    ...params,
                    src: this.args.src
                };
                this.updateNativeCover({
                    name: 'coverImage',
                    params: {
                        ...params,
                        ...getTransitionParams(this.ref('computed'))
                    }
                }).then(() => {
                    // 通知其它组件需要更新 NA 视图
                    this.updateOtherComponents();
                }).catch(() => {
                    this.args = originArgs;
                    this.logStability(STABILITY_LOG_CONFIG.coverImageUpdateError);
                });
            }
        };
        this.nextTick(() => {
            if (this.el && this.isInserted) {
                this.preLoadImg().finally(() => {
                    this.nextTick(() => {
                        this.el && afterImgLoaded();
                    });
                }).catch(e => {
                    console.warn(e);
                });
            }
        });
    },

    /**
     * 删除 NA 视图
     */
    removeNativeCoverImage() {
        if (this.isInserted) {
            const originArgs = {
                ...this.args
            };
            this.isInserted = false;
            this.args = null;
            this.removeNativeCover({
                name: 'coverImage',
                params: {
                    slaveId: `${this.slaveId}`,
                    viewId: `${this.data.get('id')}`,
                    parentId: this.getFirstParentComponentId()
                }
            }).catch(() => {
                this.isInserted = true;
                this.args = originArgs;
                this.logStability(STABILITY_LOG_CONFIG.coverImageRemoveError);
            });
        }
    },

    getAbsoluteImgPath() {
        const {appPath = '', pagePath = ''} = global.pageInfo || {};
        const src = absolutePathResolver(appPath, pagePath, this.data.get('__src'));
        this.data.set(`${privateKey}.src`, src);
        return src;
    },

    /**
     * 加载图片获取宽高
     * @return {Object} promise对象
     */
    preLoadImg() {
        const src = this.getAbsoluteImgPath();
        return new Promise((resolve, reject) => {
            const error = new Error(`${src} 资源加载失败`);
            // 防止相同的资源重复加载
            if (src === this.src) {
                this.isLoaded ? resolve() : reject(error);
            } else {
                const imgEntity = new Image();
                imgEntity.onerror = () => {
                    this.data.set(`${privateKey}.isLoaded`, false);
                    this.isLoaded = false;
                    this.onLoad({
                        loadState: 'error'
                    });
                    reject(error);
                };
                imgEntity.onload = () => {
                    this.data.set(`${privateKey}.isLoaded`, true);
                    this.isLoaded = true;
                    resolve();
                };
                imgEntity.src = src;
                this.src = src;
            }
        });
    }
};
