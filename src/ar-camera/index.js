/**
 * @file bdml's file's media elements <ar-camera>
 * @author jiamiao(jiamiao@baidu.com)
 */
import {getElementBox} from '../utils/dom';
import styles from './index.css';
import {privateKey, COMPONENT_STATE} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
// 一个页面只能创建一个arCamera
let onlyCameraFlag = false;

export default {

    behaviors: ['nativeEventEffect'],

    template: `<swan-ar-camera style="{{hiddenStyle}}"
        ar-key="{{arKey}}"
        ar-type="{{arType}}"
        key="{{key}}"
        type="{{type}}"
        flash="{{flash}}"
        data-sanid="{{provideData.componentId}}"
    >
        <div class="slot"><slot></slot></div>
    </swan-ar-camera>`,

    computed: {
        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'flash', data: ['off', 'on']}
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
        this.ARCameraId = `ARCamera${this.slaveId}`;
    },

    initData() {
        return {
            arKey: '',
            arType: '',
            key: '', // 官网文档对外接口为key和type，之前为arKey和arType依旧兼容保留
            type: '',
            flash: 'off',
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    created() {
        this.nextTick(() => {
            if (onlyCameraFlag) {
                console.error('您已经创建了arCamera');
                return;
            }
            // 接收客户端派发到slave的事件
            this.communicator.onMessage(`ARCamera_${this.ARCameraId}`, event => {
                this.dispatchNaEvent(event.params.action, event.params.e);
            });
            onlyCameraFlag = true;
            this.setKeyAttribute(this.getKeyAttribute());
            this.openCamera();
            // 监听flash属性的改变，触发NA组件update的端能力
            this.watch('flash', val => {
                this.updateARCamera();
            });
            this.watch('hidden', val => {
                this.nextTick(() => {
                    this.updateARCamera();
                });
            });
        });
    },

    detached() {
        this.removeARCamera();
    },

    /**
     * 数据变更重新计算样式
     */
    slaveUpdated() {
        if (this.box && this.isARCameraChanged()) {
            this.updateARCamera();
        }
    },

    /**
     * 判断ARCamera更新与否
     * @return {boolean} ARCamera更新与否的值
     */
    isARCameraChanged() {
        const oldBox = this.box;
        const newAttribute = this.getKeyAttribute();
        const box = newAttribute.box;
        const boxEqual = box.top === oldBox.top && box.left === oldBox.left
                        && box.width === oldBox.width && box.height === oldBox.height;
        this.setKeyAttribute(newAttribute);
        return !boxEqual;
    },

    /**
     * 关键数据改变，调用updated的端能力，若调用端能力报错，触发用户绑定error事件
     */
    updateARCamera() {
        let boxdata = this.getBoxJsData();
        this.boxjs.media.ARCamera({
            type: 'update',
            data: boxdata
        }).catch(e => {
            this.dispatchErrorEvent(e.errCode, e.errMsg);
        });
    },

    /**
     * 获取当前元素的position信息，为了判断ARCamera是否受其他元素影响position
     * @return {Object} 当前元素的position信息
     */
    getKeyAttribute() {
        return {
            box: getElementBox(this.el)
        };
    },

    /**
     * 集体设定当前组件的关键属性
     * @param {Object} [attributes] 待设置的属性
     * @return {Object} merge过的对象
     */
    setKeyAttribute(attributes) {
        return Object.assign(this, attributes);
    },

    /**
     * 端上在event中不派发具体的错误码，只在一级回调中给，由前端派发给开发者
     * @param {string} status 错误码
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
    },

    /**
     * 获取updated时端上需要的数据
     * @return {Object} 调用updated端能力时需要的参数
     */
    getBoxJsData() {
        return {
            hide: this.data.get('__hidden'),
            slaveId: this.slaveId,
            ARCameraId: this.ARCameraId,
            viewId: this.ARCameraId,
            parentId: this.getFirstParentComponentId(this),
            ARKey: this.data.get('key') || this.data.get('arKey'),
            ARType: this.data.get('type') || this.data.get('arType'),
            flash: this.data.get('__flash'),
            position: getElementBox(this.el)
        };
    },

    /**
     * 调用insert端能力初始化ARCamera
     */
    openCamera() {
        let data = this.getBoxJsData();
        if (!data) {
            return;
        }
        // todo invoke boxjs
        this.boxjs.media.ARCamera({
            type: 'insert',
            data: data
        }).then(res => {
            this.sendStateChangeMessage('ARCamera', COMPONENT_STATE.INSERT, '', this.id);
        }).catch(e => {
            this.dispatchErrorEvent(e.errCode, e.errMsg);
        });
    },

    /**
     * detached时把NA组件remove掉
     */
    removeARCamera() {
        this.boxjs.media.ARCamera({
            type: 'remove',
            data: {
                slaveId: this.slaveId,
                ARCameraId: this.ARCameraId,
                viewId: this.ARCameraId,
                parentId: this.getFirstParentComponentId(this)
            }
        }).then(res => {
            onlyCameraFlag = false;
            this.sendStateChangeMessage('ARCamera', COMPONENT_STATE.REMOVE, '', this.id);
        }).catch(e => {
            this.dispatchErrorEvent(e.errCode, e.errMsg);
        });
    }
};
