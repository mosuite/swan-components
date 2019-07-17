/**
 * @file bdml's file's base elements <audio>
 * @author  raowenjuan(raowenjuan@baidu.com)
 *          mabin(mabin03@baidu.com)
 */

import style from './index.css';
import {formatTime, privateKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {
    constructor(props) {
        this.timer = null;
        this.audio = null;
    },

    initData() {
        return {
            id: this.id,
            src: '',
            controls: false,
            loop: false,
            poster: '',
            author: '未知作者',
            name: '未知音频',
            [privateKey]: {
                currentTime: '00:00',
                playState: 0
            }
        };
    },

    computed: {

        /**
         * 根据播放状态修改播放按钮的 className
         * @return {string} playStateClassName
         */
        playStateClassName() {
            return `${this.data.get(`${privateKey}.playState`) === 1 ? style.playing : style.pause}`;
        },

        /**
         * 根据控件显示状态修改组件的 className
         * @return {string} audioShowClassName
         */
        audioShowClassName() {
            return this.data.get('__controls') ? '' : style.hide;
        },

        /**
         * 创建私有属性，供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        },

        ...internalDataComputedCreator([
            {name: 'controls', caster: typesCast.boolCast},
            {name: 'loop', caster: typesCast.boolCast}
        ])
    },

    template: `<swan-audio class="${style['swan-audio-common']} {{audioShowClassName}}"
        id="{{id}}"
        author="{{author}}"
        name="{{name}}"
        poster="{{poster}}"
        src="{{src}}"
        controls="{{__controls}}"
        loop="{{__loop}}">
        <div class="${style['swan-audio-wrapper']}">
            <div class="${style['swan-audio-left']}">
                <div class="${style.imgwrap}">
                    <img s-if="poster && poster.length" src="{{poster}}"/>
                    <span class="{{playStateClassName}}" on-click="onClick($event)"></span>
                </div>
                <div class="${style['swan-audio-songinfo']}">
                    <p class="${style['swan-audio-title']}">{{name}}</p>
                    <p class="${style['swan-audio-name']}">{{author}}</p>
                </div>
            </div>
            <div class="${style['swan-audio-right']}">{{provideData.currentTime}}</div>
        </div>
    </swan-audio>`,

    /**
     * 组件创建
     */
    attached() {
        this.createNewAudio();
        this.watch('src', val => {
            this.createNewAudio(val);
        });
    },

    /**
     * 创建audio并设置监听函数
     *
     * @param {string=} newSrc 变化后src
     */
    createNewAudio(newSrc) {
        // 第一次没有this.audio
        this.audio && this.audio.pause();
        this.data.set(`${privateKey}.currentTime`, '00:00');
        this.audio = new global.Audio();
        this.bindLoadEvents();
        this.audio.src = newSrc || this.data.get('src');
        this.onended()
            .onplay()
            .onpause()
            .ontimeupdate();
    },

    bindLoadEvents() {
        this.audio.onerror = e => {
            const code = e.srcElement.error.code;
            let msg = '';
            switch (code) {
                case 1: msg = 'MEDIA_ERR_ABORTED';
                    break;
                case 2: msg = 'MEDIA_ERR_NETWORK';
                    break;
                case 3: msg = 'MEDIA_ERR_DECODE';
                    break;
                case 4: msg = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
            }
            this.dispatchEvent('binderror', {
                detail: {
                    errMsg: msg,
                    code
                }
            });
        };
        // window.audio 没有 onload事件，所以这里触发不了： https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
        // 文档上也没有说明bindload
        this.audio.onload = e => {
            this.dispatchEvent('bindload', {
                detail: {
                    msg: 'load audio resource'
                }
            });
        };
    },

    /**
     * 组件销毁
     */
    detached() {
        if (this.audio) {
            this.audio.pause();
            this.timer && clearInterval(this.timer);
            this.timer = null;
            this.audio = null;
        }
    },

    /**
     * 播放结束
     *
     * @return {Object} 链式调用对象
     */
    onended() {
        this.audio.onended = () => {
            this.data.set(`${privateKey}.playState`, 0);
            this.getEndTime();
            if (this.data.get('__loop')) {
                this.audio.play();
            }
            this.dispatchEvent('bindended', {
                detail: {
                    duration: this.audio.duration
                }
            });
        };
        return this;
    },

    /**
     * 播放
     *
     * @return {Object} 链式调用对象
     */
    onplay() {
        this.audio.onplay = () => {
            this.data.set(`${privateKey}.playState`, 1);
            this.getCurrentTime();
            this.dispatchEvent('bindplay', {
                detail: {
                    duration: this.audio.duration
                }
            });
        };
        return this;
    },

    /**
     * 暂停
     *
     * @return {Object} 链式调用对象
     */
    onpause() {
        this.audio.onpause = () => {
            this.data.set(`${privateKey}.playState`, 0);
            this.getEndTime();
            this.audio && this.dispatchEvent('bindpause', {
                detail: {
                    duration: this.audio.duration
                }
            });
        };
        return this;
    },

    /**
     * 更新时间当前播放时刻和剩余时间
     *
     * @return {Object} 链式调用对象
     */
    ontimeupdate() {
        this.audio.ontimeupdate = () => {
            this.audio && this.dispatchEvent('bindtimeupdate', {
                detail: {
                    currentTime: this.audio.currentTime,
                    duration: this.audio.duration
                }
            });
        };
        return this;
    },

    /**
     * 计算当前播放时间
     */
    getCurrentTime() {
        this.timer = setInterval(() => {
            this.data.set(`${privateKey}.currentTime`, formatTime(Math.floor(this.audio.currentTime)));
        }, 1000);
    },

    /**
     * 停止设置当前播放时间
     */
    getEndTime() {
        clearInterval(this.timer);
    },

    /**
     * 播放按钮点击事件处理器
     *
     * @param {Event} $event 事件对象
     */
    onClick($event) {
        if (this.data.get(`${privateKey}.playState`) === 1) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    }
};
