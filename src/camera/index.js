/**
 * @file bdml's file's media elements <camera>
 * @author lijiahui(lijiahui02@baidu.com)
 *         sunbaixin(sunbaixin@baidu.com)
 */
import styles from './index.css';
import {isEqualObject, privateKey, COMPONENT_STATE} from '../utils';
import {getElementBox} from '../utils/dom';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
let onlyCameraFlag = false;

export default {

    behaviors: ['nativeEventEffect'],

    template: `<swan-camera device-position="{{devicePosition}}"
        flash="{{flash}}"
        style="{{hiddenStyle}}"
        data-sanid="{{provideData.componentId}}"
    >
        <div class="slot"><slot></slot></div>
    </swan-camera>`,

    computed: {
        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'devicePosition', data: ['back', 'front']},
            {name: 'flash', data: ['auto', 'on', 'off']}
        ]),

        hiddenStyle() {
            return this.data.get('__hidden') ? ';display:none;' : '';
        },

        /**
         * 创建私有属性，供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },

    constructor(props) {
        this.cameraId = new Date().getTime() + '';
        this.isInserted = false;
    },

    initData() {
        return {
            hidden: false,
            devicePosition: 'back',
            flash: 'auto',
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    created() {
        this.nextTick(() => {
            if (onlyCameraFlag) {
                return;
            }
            // 接收客户端派发到slave的事件
            this.communicator.onMessage(`camera_${this.cameraId}`, event => {
                this.dispatchNaEvent(event.params.action, event.params.e);
            });
            onlyCameraFlag = true;
            this.openCamera();
        });
    },

    detached() {
        if (onlyCameraFlag) {
            onlyCameraFlag = false;
            this.removeCamera();
        }
    },

    /**
     * 获取updated时端上需要的数据
     * @return {Object} 调用updated端能力时需要的参数
     */
    getBoxJsData() {
        return {
            hide: this.data.get('__hidden'),
            devicePosition: this.data.get('__devicePosition'),
            flash: this.data.get('__flash'),
            position: getElementBox(this.el),
            slaveId: this.slaveId,
            cameraId: this.cameraId,
            viewId: this.cameraId,
            parentId: this.getFirstParentComponentId(this)
        };
    },

    /**
     * 调用insert端能力初始化camera
     */
    openCamera() {
        let params = this.getBoxJsData();
        if (!params) {
            return;
        }
        // todo invoke boxjs
        this.isInserted = true;
        this.boxjs.media.camera({
            type: 'insert',
            data: params
        }).then(res => {
            this.args = {...params};
            this.sendStateChangeMessage('camera', COMPONENT_STATE.INSERT, '', this.id);
        }).catch(e => {
            this.isInserted = false;
            this.dispatchErrorEvent(e.errCode, e.errMsg);
        });
    },

    removeCamera() {
        this.isInserted = false;
        this.boxjs.media.camera({
            type: 'remove',
            data: {
                slaveId: this.args.slaveId,
                cameraId: this.args.cameraId,
                viewId: this.args.viewId,
            }
        }).then(res => {
            this.sendStateChangeMessage('camera', COMPONENT_STATE.REMOVE, '', this.id);
        }).catch(res => {
            this.isInserted = true;
        });
    },

    /**
     * 关键数据改变，调用updated的端能力，若调用端能力报错，触发用户绑定error事件
     */
    updateCamera() {
        let params = this.getBoxJsData();
        if (this.isInserted && !isEqualObject(this.args, params)) {
            this.boxjs.media.camera({
                type: 'update',
                data: params
            }).then(res => {
                this.args = {...params};
            }).catch(e => {
                this.dispatchErrorEvent(e.errCode, e.errMsg);
            });
        }
    },
    slaveUpdated() {
        this.updateCamera();
    },

    /**
     * 端上在event中不派发具体的错误码，只在一级回调中给，由前端派发给开发者
     * @param {number} status 错误码
     * @param {string} message 错误信息
     */
    dispatchErrorEvent(status, message) {
        this.dispatchEvent('binderror', {detail: {status, message}});
    },

    /**
     * 接收端上触发的自定义事件，派发给用户
     * @param {string} eventName 要触发的事件名称
     * @param {string} params 端上传回的data数据
     */
    dispatchCustomEvent(eventName, params) {
        let data = JSON.parse(params.data);
        this.dispatchEvent(eventName, {
            detail: {
                ...data
            }
        });
    }
};
