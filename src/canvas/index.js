/**
 * @file bdml's file's base elements <view>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import styles from './index.css';
import {privateKey, COMPONENT_STATE} from '../utils';
import {getElementBox} from '../utils/dom';
import {getCustomEventMap} from '../utils/event';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {
    behaviors: ['nativeEventEffect'],
    template: `
        <swan-canvas canvas-id="{{canvasId}}"
            style="{{hiddenStyle}}"
            data-sanid="{{provideData.componentId}}">
            <canvas></canvas>
            <div class="slot"><slot></slot></div>
        </swan-canvas>`,

    computed: {
        ...internalDataComputedCreator([
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'canvasId', caster: typesCast.stringCast},
            {name: 'disableScroll', caster: typesCast.boolCast}
        ]),
        hiddenStyle() {
            return !this.data.get('__canvasId') || this.data.get('__hidden') ? 'display:none;' : '';
        },

        /**
         * 创建私有属性，供模板使用
         *
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },

    initData() {
        return {
            hidden: false,
            disableScroll: false,
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    created() {
        this.nextTick(() => {
            if (!this.data.get('__canvasId')) {
                console.error('canvas-id is required');
                return;
            }

            this.setKeyAttribute(this.getKeyAttribute());
            this.insertCanvas();
            this.noticeSlaveEvents();
        });
    },

    detached() {
        this.removeCanvas();
    },

    slaveUpdated() {
        if (this.box && this.isCanvasChanged()) {
            this.updateCanvas();
        }
    },

    insertCanvas() {
        this.boxjs.canvas.insert(this.getCanvasAttributes())
        .then(res => {
            this.sendStateChangeMessage('canvas', COMPONENT_STATE.INSERT, this.canvasId, this.id);
        })
        .catch(e => {
            console.log('canvas insert error', e);
        });
    },

    updateCanvas() {
        this.boxjs.canvas.update(this.getCanvasAttributes());
    },

    removeCanvas() {
        this.boxjs.canvas.remove({
            slaveId: this.slaveId,
            canvasId: this.id
        }).then(res => {
            this.sendStateChangeMessage('canvas', COMPONENT_STATE.REMOVE, this.canvasId, this.id);
        });
    },

    getHidden() {
        return +(this.el.style.display === 'none') || +this.data.get('__hidden');
    },

    getCanvasAttributes() {
        return {
            canvasId: this.id,
            slaveId: this.slaveId,
            hide: this.hide + '',
            disableScroll: this.disableScroll + '',
            gesture: this.hasGestrue(),
            position: this.box
        };
    },

    getKeyAttribute() {
        return {
            canvasId: this.data.get('__canvasId'),
            box: getElementBox(this.el),
            hide: this.getHidden(),
            disableScroll: +this.data.get('__disableScroll')
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
     * 判断canvas更新与否
     * @return {boolean} canvas更新与否的值
     */
    isCanvasChanged() {
        const oldBox = this.box;
        const newAttribute = this.getKeyAttribute();
        const {box, hide, disableScroll} = newAttribute;
        const boxEqual = box.top === oldBox.top && box.left === oldBox.left
                        && box.width === oldBox.width && box.height === oldBox.height;
        const disableScrollEqual = disableScroll === this.disableScroll;
        const hideEqual = hide === this.hide;
        this.setKeyAttribute(newAttribute);
        return !boxEqual || !disableScrollEqual || !hideEqual;
    },

    /**
     * 接收客户端派发的事件，用于映射行为touchstart/touchmove等
     */
    noticeSlaveEvents() {
        this.communicator.onMessage(`canvas_${this.id}`, event => {
            this.dispatchNaEvent(event.params.action, event.params.e);
        });
    }
};
