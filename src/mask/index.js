/**
 * @file mask 不建议使用该组件，也不会继续维护
 * @author liuyuekeng(liuyuekeng@baidu.com)
 */
import style from './index.css';

export default {
    behaviors: ['userTouchEvents', 'noNativeBehavior', 'animateEffect'],
    template: `<swan-mask>
        <div style="display:{{hidden ? 'none' : 'block'}}"></div>
    </swan-mask>`,
    initData() {
        return {
            hidden: true
        };
    }
};