/**
 * @file bdml's file's base elements <Navigator>
 * @author houyu(houyu01@baidu.com)
 *         jianglian(jianglian01@baidu.com)
 */
import style from './index.css';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {

    behaviors: ['userTouchEvents', 'noNativeBehavior', 'hoverEffect', 'animateEffect'],

    initData() {
        return {
            target: '',
            appId: '',
            path: '',
            url: '',
            delta: '',
            extraData: '',
            version: 'release',
            openType: 'navigate',
            privateStyle: style,
            privateClass: '',
            hoverStartTime: 50,
            hoverStayTime: 600,
            hoverStopPropagation: false,
            hoverClass: style['navigator-hover']
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'target', data: ['self', 'miniProgram']},
            {name: 'appId', caster: typesCast.stringCast},
            {name: 'path', caster: typesCast.stringCast},
            {name: 'url', caster: typesCast.stringCast},
            {name: 'delta', caster: typesCast.numCast},
            {name: 'version', data: ['release', 'develop', 'trial']},
            {name: 'openType', data: ['navigate', 'redirect', 'switchTab', 'reLaunch', 'navigateBack', 'exit']},
            {name: 'privateClass', caster: typesCast.stringCast}
        ])
    },

    template: `<swan-nav class="{{__privateClass}} swan-spider-tap"
        href="{{__url || ''}}"
    >
        <slot></slot>
    </swan-nav>`,

    compiled() {
        this.bindAction('bindtap', $event => {
            if (this.data.get('__target') === 'miniProgram') {
                if (this.data.get('__openType') === 'navigate') {
                    let {__appId, __path, __version} = this.data.get();

                    // 三个version： release/develop/trial 分别对应的后缀为 ''/_dev/_trial
                    if (__version === 'develop') {
                        __appId += '_dev';
                    }
                    else if (__version === 'trial') {
                        __appId += '_trial';
                    }
                    this.boxjs.webView.launch({
                        appid: __appId,
                        url: __path,
                        navi: 'naviTo', // 小程序间跳转
                        extraData: this.data.get('extraData'),
                        domId: this.uid
                    }).then(res => {
                        this.jumpMiniProgramCallback('success', 'navigateToMiniProgram:ok');
                    }).catch(err => {
                        this.jumpMiniProgramCallback('fail', 'navigateToMiniProgram:error');
                        console.log('webview-launch-fail: ', err);
                    });
                }
                else if (this.data.get('__openType') === 'exit') {
                    this.boxjs.webView.exit();
                }
            } else {
                this.dispatch('abilityMessage', {
                    eventType: 'navigate',
                    eventParams: {
                        uri: this.data.get('__url'),
                        openType: this.data.get('__openType'),
                        delta: this.data.get('__delta'),
                        domId: this.uid
                    }
                });
            }

        });
    },
    jumpMiniProgramCallback(eventName, errMsg) {
        this.dispatchEvent.call(this, `bind${eventName}`, {
            detail: {
                errMsg
            }
        });
        this.dispatchEvent.call(this, 'bindcomplete', {
            detail: {
                errMsg
            }
        });
    }
};
