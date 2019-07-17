/**
 * @file bdml's file's base elements <view>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import {internalDataComputedCreator, typesCast} from '../computedCreator';
export default {

    superComponent: 'swan-component',

    template: `<swan-view class="{{__privateClass}}">
        <slot></slot>
    </swan-view>`,

    behaviors: ['userTouchEvents', 'noNativeBehavior', 'hoverEffect', 'animateEffect', 'nativeEventEffect'],

    initData() {
        return {
            privateClass: '',
            hoverStartTime: 50,
            hoverStayTime: 400,
            hoverStopPropagation: false
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'privateClass', caster: typesCast.stringCast},
            {name: 'hoverStopPropagation', caster: typesCast.boolCast},
            {name: 'hoverStartTime', caster: typesCast.numCast, default: 50},
            {name: 'hoverStayTime', caster: typesCast.numCast, default: 400}
        ])
    }
};
