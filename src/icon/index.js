/**
 * @file bdml's file's icon elements <icon>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import style from './index.css';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {

    behaviors: ['userTouchEvents', 'noNativeBehavior', 'hoverEffect', 'animateEffect'],
    template: `
        <swan-icon
            class="{{__privateClass}}">
            <span class="{{iconClass}} ${style['swan-icon']}" 
            s-if="{{__type != 'loadingWhite' && __type != 'loadingGrey'}}" 
            style="{{__color ? 'color:' + __color : ''}};{{__size ? 'font-size:' + __size + 'px': ''}}"></span>
            <span class="{{iconClass}} ${style['swan-icon']}" 
            s-if="{{__type == 'loadingWhite' || __type == 'loadingGrey'}}" 
            style="width: {{__size}}px;height: {{__size}}px;"></span>
        </swan-icon>`,
    computed: {
        ...internalDataComputedCreator([
            {name: 'privateClass', caster: typesCast.stringCast},
            {name: 'hoverStopPropagation', caster: typesCast.boolCast},
            {name: 'type', caster: typesCast.stringCast},
            {name: 'size', caster: typesCast.numCast},
            {name: 'color', caster: typesCast.stringCast}
        ]),
        iconClass() {
            return style['swan-icon-' + this.data.get('__type')];
        }
    },

    initData() {
        return {
            privateClass: '',
            hoverStopPropagation: false,
            type: '',
            size: 23,
            color: ''
        };
    }
};