/**
 * @file bdml's file's swiper-item elements <swiper-item>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import style from './index.css';

export default {

    behaviors: ['userTouchEvents', 'noNativeBehavior'],

    template: `
        <swan-swiper-item item-id="{{itemId}}">
            <slot></slot>
        </swan-swiper-item>`,

    initData() {
        return {
            itemId: ''
        };
    },

    attached() {
        Object.assign(this.el.style, {
            'width': '100%',
            'height': '100%'
        });
    }
};
