/**
 * @file bdml's file's swan-slider elements <slider>
 * @author jiamiao(jiamiao@baidu.com)
 */
import style from './index.css';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {

    behaviors: ['userTouchEvents', 'form', 'animateEffect'],

    template: `<swan-slider>
        <div class="${style['swan-slider']}">
            <div class="${style['swan-slider-wrapper']}">
                <div class="${style['swan-slider-tap-area']}"
                    on-touchstart="onTouchStart($event)"
                    on-touchmove="onTouchMove($event)"
                    on-touchend="onTouchEnd($event)">
                    <div class="${style['swan-slider-handle-wrapper']}"
                        style="background: {{backgroundColor}};">
                        <div class="${style['swan-slider-handle']}"
                            style="left: {{handleLeft}}%;"></div>
                        <div class="${style['swan-slider-thumb']}"
                            style="left: {{handleLeft}}%;
                            background: {{blockColor}};
                            width: {{blockSize}}px;
                            height: {{blockSize}}px;
                            margin-top: -{{blockSize/2}}px;
                            margin-left: -{{blockSize/2}}px;"></div>
                        <div class="${style['swan-slider-track']}"
                            style="background: {{activeColor}}; width: {{handleLeft}}%;"></div>
                    </div>
                </div>
                <span s-if="{{__showValue && __showValue !== 'false'}}" class="${style['swan-slider-value']}">
                    {{value}}
                </span>
            </div>
        </div>
    </swan-slider>`,

    constructor(props) {
        this.touchstartElement = '';
        this.startPageX = 0; // touchstart时的坐标点，为了判断touchend是否是点击结束还是移动结束
        this.name = this.data.get('name');
    },

    initData() {
        return {
            value: 0, // slider 数值
            max: 100, // slider 最大值
            min: 0, // slider 最小值
            step: 1, // 步长
            disabled: false, // 是否禁用
            backgroundColor: '#CCC', // 背景颜色
            activeColor: '#3C76FF', // 前景颜色
            showValue: false, // 是否显示数值
            blockColor: '#FFF', // 滑块的颜色
            blockSize: '24' // 滑块的大小，取值范围为 12 - 28，默认为24
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'disabled', caster: typesCast.boolCast},
            {name: 'showValue', caster: typesCast.boolCast}
        ]),
        min() {
            const min = this.data.get('min');
            return typeof min === 'number' ? min : ~~min;
        },
        max() {
            const max = this.data.get('max');
            return typeof max === 'number' ? max : ~~max;
        },
        value() {
            let min = this.data.get('min');
            let max = this.data.get('max');
            let value = this.data.get('value');
            let step = this.data.get('step');
            value = typeof value === 'number' ? value : ~~value;
            value < min && (value = min);
            value > max && (value = max);
            return Math.round(value / step) * step;
        },
        blockSize() {
            let blockSize = this.data.get('blockSize');
            blockSize < 12 && (blockSize = 12);
            blockSize > 28 && (blockSize = 28);
            return blockSize;
        },
        handleLeft() {
            let min = this.data.get('min');
            let max = this.data.get('max');
            let value = this.data.get('value');
            return (value - min) * 100 / (max - min);
        }
    },

    created() {
        // 为了reset表单时记录重置的slider默认属性
        this.defaultValue = this.data.get('value');
    },

    attached() {
        this.watch('name', name => {
            this.reRegisterFormItem(this.name);
            this.name = name;
        });
    },

    /**
     * 鼠标点击事件，记录起始点击位置
     * @param {Object} [event] 鼠标event对象
     */
    onTouchStart(event) {
        this.touchstartElement = event.target;
        this.startPageX = event.changedTouches[0].pageX;
        event.stopPropagation();
        event.preventDefault();
    },

    /**
     * 鼠标移动事件，做出相对应ui变化，并且触发changing
     * @param {Object} [event] 鼠标event对象
     */
    onTouchMove(event) {
        if (this.touchstartElement.className !== style['swan-slider-handle']) {
            return;
        }
        let $event = event.changedTouches[0];
        this.moveTo($event.clientX);
        this.fireBindChange('bindchanging');
        event.stopPropagation();
        event.preventDefault();
    },

    /**
     * 鼠标移动结束事件，做出相对应ui变化，并且触发change
     * @param {Object} [event] 鼠标event对象
     */
    onTouchEnd(event) {
        let $event = event.changedTouches[0];
        // 若touchstart的元素不是滑块且end比start小于10距离时，才是点击某个点位移而不是move
        if (this.touchstartElement.className !== style['swan-slider-handle']
            && Math.abs($event.pageX - this.startPageX) < 10) {
            this.moveTo($event.clientX);
        }
        this.fireBindChange('bindchange');
        event.stopPropagation();
        event.preventDefault();
    },

    /**
     * 触发slider对应事件
     * @param {string} [type] 触发事件的名称
     */
    fireBindChange(type) {
        this.dispatchEvent.call(this, type, {
            detail: {
                value: this.data.get('value')
            }
        });
    },

    /**
     * slider中滑块移动的方法
     * @param {number} [targetX] 结束点的x坐标
     */
    moveTo(targetX) {
        if (this.data.get('__disabled')) {
            return;
        }
        const {max, min, step} = this.data.get();
        let wrapper = this.el.querySelector('.' + style['swan-slider-tap-area']);
        let wrapperWidth = wrapper.clientWidth;
        // 控制最大最小值在slider中
        let sliderActiveWidth = Math.min(Math.max(0, targetX - wrapper.getBoundingClientRect().left), wrapperWidth);
        let steps = (max - min) / step;
        let stepDistance = wrapperWidth / steps;
        let targetStep = Math.round(sliderActiveWidth / stepDistance);
        let currentValue = min + targetStep * step;
        if (currentValue > max || currentValue < min) {
            return;
        }
        this.data.set('value', currentValue);
    },

    // override behavior
    getFormValue() {
        return this.data.get('value');
    },

    // override behavior
    resetFormValue() {
        this.data.set('value', this.defaultValue);
        return null;
    }
};
