/**
 * @file bdml's file's base elements <live-player>
 * @author raowenjuan(raowenjuan@baidu.com)
 *         mabin(mabin03@baidu.com)
 *         lijiahui(lijiahui02@baidu.com)
 */

import style from './index.css';
import {getElementBox} from '../utils/dom';
import {isEqualObject, privateKey, COMPONENT_STATE} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {STABILITY_LOG_CONFIG} from '../utils/constant';

let PLAYER_WIDTH = screen.height;
let PLAYER_HEIGHT = screen.width;

export default {
    behaviors: ['nativeEventEffect'],
    constructor(props) {
        this.args = null;
        this.liveData = {};
        this.timer = {};
    },

    initData() {
        return {
            hidden: false,
            id: this.id,
            src: '',
            autoplay: false,
            muted: false,
            orientation: 'vertical',
            objectFit: 'contain',
            backgroundMute: false,
            minCache: 1,
            maxCache: 3,
            [privateKey]: {
                componentId: this.id,
                isFullscreen: false,
                playerWidth: PLAYER_WIDTH,
                playerHeight: PLAYER_HEIGHT
            }
        };
    },

    template: `<swan-live-player class="${style.liveWrapper}"
        id="{{id}}"
        style="{{hiddenStyle}}"
        data-sanid="{{provideData.componentId}}"
    >
        <span class="${style.liveicon}" on-click="openLivePlayer"></span>
        <div s-ref="slot"
            style="display: {{provideData.isFullscreen ? 'none' : 'block'}}"
            class="slot">
            <slot s-if="{{!provideData.isFullscreen}}"></slot>
        </div>
        <div s-ref="full"
            style="{{getFullscreenContainerStyle}}"
            class="full">
            <slot s-if="{{provideData.isFullscreen}}"></slot>
        </div>
    </swan-live-player>`,

    computed: {
        hiddenStyle() {
            let style = this.data.get('style');
            const hidden = this.data.get('__hidden');
            style += hidden ? ';display: none;' : '';
            return style;
        },

        /**
         * 根据当前播放器是否全屏的状态生成全屏容器的宽高
         * @return {string} style
         */
        getFullscreenContainerStyle() {
            const {isFullscreen, playerWidth, playerHeight} = this.data.get('provideData');
            return `display: ${isFullscreen ? 'block' : 'none'}; width: ${playerWidth}px; height: ${playerHeight}px`;
        },

        /**
         * 产出 provideData 供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        },

        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'autoplay', caster: typesCast.boolCast},
            {name: 'muted', caster: typesCast.boolCast},
            {name: 'orientation', data: ['vertical', 'horizontal']},
            {name: 'objectFit', data: ['contain', 'fillCrop']},
            {name: 'backgroundMute', caster: typesCast.boolCast},
            {name: 'minCache', caster: typesCast.numCast, default: 1},
            {name: 'maxCache', caster: typesCast.numCast, default: 3}
        ])
    },

    /**
     * dom元素创建完成但未渲染到页面
     */
    created() {
        this.nextTick(() => {
            this.args = this.getPlayerData();
            this.openLivePlayer();
        });
    },

    /**
     * 组件创建
     */
    attached() {
        // 接收客户端派发到slave的事件
        this.communicator.onMessage(`live_${this.id}`, event => {
            this.dispatchNaEvent(event.params.action, event.params.e);
        });
    },

    /**
     * 响应数据变化
     */
    slaveUpdated() {
        const params = this.getPlayerData();
        if (!this.args || isEqualObject(params, this.args)) {
            return;
        }

        const oldSrc = this.args.src;
        this.args = params;
        // src变化调open，其余属性调update
        if (oldSrc !== this.args.src) {
            this.openLivePlayer();
        }
        else {
            this.updateLivePlayer();
        }
    },

    /**
     * [TODO] 组件销毁时移除贴片: 当前没有remove接口，故设置hide隐藏
     * 组件销毁
    */
    detached() {
        if (this.isInserted) {
            this.removeLivePlayer();
        }
    },

    /**
     * 获取端能力所需参数集合
     *
     * @return {Object} 参数集合
     */
    getPlayerData() {
        const {
            src,
            __muted,
            __orientation,
            __objectFit,
            __backgroundMute,
            __minCache,
            __maxCache,
            __hidden,
            __autoplay
        } = this.data.get();
        return {
            gesture: this.hasGestrue(),
            hide: __hidden,
            slaveId: this.slaveId,
            liveId: this.id,
            viewId: this.id,
            parentId: this.getFirstParentComponentId(this),
            src,
            position: getElementBox(this.el),
            autoplay: __autoplay,
            muted: __muted,
            orientation: __orientation,
            objectFit: __objectFit,
            backgroundMute: __backgroundMute,
            minCache: __minCache,
            maxCache: __maxCache
        };
    },

    /**
     * 创建na贴片
     */
    openLivePlayer() {
        if (this.args.hide) {
            return;
        }

        this.boxjs.media.live({
            type: 'insert',
            data: this.args
        }).then(() => {
            // 标记贴片已经创建
            this.isInserted = true;
            this.sendStateChangeMessage('live', COMPONENT_STATE.INSERT, this.data.get('id'), this.args.liveId);
        }).catch(err => {
            console.warn('live player open fail', err);
            this.logStability(STABILITY_LOG_CONFIG.livePlayerOpenError);
        });
    },

    /**
     * 移除na贴片
     */
    removeLivePlayer() {
        this.boxjs.media.live({
            type: 'remove',
            data: {
                slaveId: this.args.slaveId,
                liveId: this.args.liveId,
                viewId: this.args.viewId
            }
        }).then(res => {
            this.sendStateChangeMessage('live', COMPONENT_STATE.REMOVE, this.data.get('id'), this.args.liveId);
        });
    },

    /**
     * 有除src外的参数变化就调用update接口
     */
    updateLivePlayer() {
        if (!this.isInserted) {
            this.openLivePlayer();
        }
        else {
            this.boxjs.media.live({
                type: 'update',
                data: this.args
            });
            /**
            * [BUG] 端上没有触发一级回调，暂时去掉 then、 catch
            * 回调策略暂定为始终成功
            .then(() => {
                this.args = {
                    ...params
                };
            }).catch(err => {
                console.warn('updateLivePlayer::error:', err);
            });
            */
        }
    },

    /**
     * 全屏处理
     *
     * @param {Object} data 端返回的数据
     */
    fullScreenChangeHandler(data) {
        const {direction, fullscreen, width, height} = data;
        console.log('data:', data);
        this.data.set(`${privateKey}.playerWidth`, width);
        this.data.set(`${privateKey}.playerHeight`, height);

        // 标记是否全屏状态
        this.data.set(`${privateKey}.isFullscreen`, fullscreen === '1');
        this.data.set(`${privateKey}.direction`, direction);

        const self = this;
        // 加延迟 防止频繁触发屏幕切换
        this.nextTick(() => {
            clearTimeout(this.timer.fullscreenchange);
            this.timer.fullscreenchange = setTimeout(() => {
                this.communicator.fireMessage({
                    type: 'fullscreenchange',
                    data: {}
                });

                // android 端会频繁触发屏幕切换，需要加延迟解决
            }, self.swaninterface.boxjs.platform.isIOS() ? 0 : 500);
        });
    },

    /**
     * 通知master获取bind方法handler映射
     *
     * @param {string} eventName 事件名称
     * @param {Object} params 参数
     */
    dispatchCustomEvent(eventName, params) {
        let data = JSON.parse(params.data);
        let detail = {
            ...data
        };
        if (eventName === 'bindfullscreenchange') {
            this.fullScreenChangeHandler(data);
        }
        else if (eventName === 'binderror') {
            this.logStability(STABILITY_LOG_CONFIG.livePlayerBindError);
        }

        this.dispatchEvent(eventName, {
            detail
        });
    }
};
