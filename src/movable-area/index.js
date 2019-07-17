/**
 * @file swan's file's base elements <movable-are>
 * @author lvlei(lvlei03@baidu.com)
 */
import style from './index.css';
import {computeDistance} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {

    behaviors: ['userTouchEvents', 'noNativeBehavior', 'animateEffect'],

    constructor(props) {
        this.isAreaDoublePointScaling = false; // 双指缩放状态控制
    },

    initData() {
        return {
            scaleArea: false
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'scaleArea', caster: typesCast.boolCast}
        ])
    },

    template: `<swan-movable-area
        on-touchstart="onMovableAreaTouchStart($event)"
        on-touchmove="onMovableAreaTouchMove($event)"
        on-touchend="onMovableAreaTouchEnd($event)">
        <slot></slot>
    </swan-movable-area>`,

    /**
     * 向movable-view传递信息
     * @param {number} [scale] movable-area区域缩放的倍数
     * @param {number} [status] 传透给movable-view的数据状态 (0进行相应缓存，1为设置movable-view scale)
     */
    communicatorView(scale = 1, status = 0) {
        this.el.children.length && this.communicator.fireMessage({
            type: 'movableArea:changeScaleVal',
            data: {
                scale,
                id: this.el.children[0].id,
                status
            }
        });
    },

    /**
     * 阻止事件冒泡
     * @param {Object} [e] 鼠标event对象
     */
    preventEvents(e) {
        e.stopPropagation();
        e.preventDefault();
    },

    /**
     * 鼠标开始触碰触发的事件
     * @param {Object} [e] 鼠标event对象
     */
    onMovableAreaTouchStart(e) {
        // this.preventEvents(e);
    },

    /**
     * 移动时触发的事件
     * @param {Object} [e] 鼠标event对象
     */
    onMovableAreaTouchMove(e) {
        this.data.get('__scaleArea') && this.preventEvents(e);
        this.doubleFingerOperation(e);
    },

    /**
     * 鼠标结束触碰触发的事件，重置标识是否为缩放中的值
     * @param {Object} [e] 鼠标event对象
     */
    onMovableAreaTouchEnd(e) {
        this.isAreaDoublePointScaling = false;
    },

    /**
     * movable-area开启scaleArea属性后，支持双指操作movable-area来改变movable-view的scaleValue从而使movable-view缩放
     * @param {Object} [e] 鼠标event对象
     */
    doubleFingerOperation(e) {
        if (e.changedTouches.length >= 2 && this.data.get('__scaleArea')) {
            const startInfo0 = e.changedTouches[0];
            const startInfo1 = e.changedTouches[1];
            // 缓存第一次双指触屏两指的距离
            if (!this.isAreaDoublePointScaling) {
                this.lastDistance = computeDistance({x: startInfo0.pageX, y: startInfo0.pageY}
                    , {x: startInfo1.pageX, y: startInfo1.pageY});
                this.communicatorView();
                this.isAreaDoublePointScaling = true;
            }
            this.currentDistance = computeDistance({x: startInfo0.pageX, y: startInfo0.pageY}
                , {x: startInfo1.pageX, y: startInfo1.pageY});
            const durAreaScaleVal = this.currentDistance / this.lastDistance;
            this.communicatorView(Math.sqrt(durAreaScaleVal), 1);
        }
    }
};
