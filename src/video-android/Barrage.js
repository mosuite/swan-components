/**
 * @file 基于 Canvas 实现弹幕
 * @author wuhuiyao@baidu.com
 */

'use strict';

export default class Barrage {

    /**
     * 创建弹幕实例
     *
     * @param {HTMLElement|string} container 弹幕容器元素或者元 dom id
     * @param {Array<Object>=} barrageList 初始化弹幕列表，结构如下
     *        [{
     *            text: 'xxx',   // 要显示的弹幕文本信息
     *            color: '#fff', // 弹幕的文本颜色，可选，默认随机颜色
     *            time: 2        // 显示该弹幕对应的视频播放时间，单位：秒
     *        }]
     */
    constructor(container, barrageList) {
        this.container = typeof container === 'string'
            ? document.getElementById(container) : container;

        this.initBarrageList(barrageList);
        this.currPlayBarrageList = [];

        this.barrageRenderer = this.update.bind(this);
        this.isPlaying = false;
        this.destroyed = false;
        this.currPlayTime = null;
        this.playedTrackInfo = {};
    }

    /**
     * 初始化弹幕画布元素
     *
     * @private
     */
    initCanvas() {
        if (this.canvas) {
            return;
        }

        let container = this.container;
        let canvas = document.createElement('canvas');
        container.appendChild(canvas);

        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.resize();
    }

    /**
     * 调整画布大小，如果画布容器元素大小发生变化，需要调用该方法
     *
     * @param {Object=} size 指定弹幕宽高，可选，默认为容器宽高
     */
    resize(size) {
        if (this.destroyed || !this.ctx) {
            return;
        }

        let canvasElem = this.canvas;
        let canvas = this.ctx.canvas;

        // 设置画布大小
        let {width, height} = size || {};
        let parentElem = this.container;
        this.width = width || parentElem.offsetWidth;
        this.height = height || parentElem.offsetHeight;
        canvasElem.style.width = this.width + 'px';
        canvasElem.style.height = this.height + 'px';

        canvas.width = this.width;
        canvas.height = this.height;

        // 设置字体
        let fontSize = 18;
        this.barrageHeight = fontSize + 5; // 5 为 弹道之间 gap
        this.ctx.font = `${fontSize}px Microsoft YaHei`;

        // reset barrage init position
        let allBarrageMap = this.allBarrageMap;
        allBarrageMap && Object.keys(allBarrageMap).forEach(k => {
            let items = allBarrageMap[k];
            items.forEach(b => (b.x = this.width));
        });

        // 初始化可用的弹道数量，按弹道放入弹幕，尽可能减少弹幕碰撞
        this.trackNum = Math.floor(this.height / this.barrageHeight);
    }

    /**
     * 初始化弹幕列表
     *
     * @private
     * @param {Array} barrageList 要初始化弹幕列表
     */
    initBarrageList(barrageList) {
        this.allBarrageMap = {};
        barrageList && barrageList.forEach(item => this.add(item));
    }

    /**
     * 判断给定的弹道能否发射弹幕
     *
     * @private
     * @param {number} trackIdx 要发射的弹道索引
     * @return {boolean}
     */
    isBarrageCanPut(trackIdx) {
        let track = this.playedTrackInfo[trackIdx];

        // 该弹道没有任何弹幕，则直接放入
        let canPut = !track || track.removed;

        // 如果该弹道最后一个弹幕整个弹幕已经完全露出来，则下一个弹幕可以放入
        canPut || (canPut = track.x < this.width - track.width);
        return canPut;
    }

    /**
     * 获取弹幕发射的弹道索引，只确保初始时候弹幕尽量不碰撞
     *
     * @private
     * @param {Object} barrage 要发射的弹幕
     * @return {number}
     */
    getBarrageShootTrackIndex(barrage) {
        let total = this.trackNum;

        // 先尝试随机在上半区发射弹道，随机的弹道不能发射，则按序选择一个可发射弹道
        // 随机弹道索引: [0, halfTrackIdx)
        let halfTrackIdx = Math.ceil(total / 2);
        let randomTrackIdx = Math.floor(Math.random() * halfTrackIdx);

        let shootTrackIdx = -1;
        if (this.isBarrageCanPut(randomTrackIdx)) {
            shootTrackIdx = randomTrackIdx;
        }
        else {
            for (let i = 0; i < total; i++) {
                if (this.isBarrageCanPut(i)) {
                    shootTrackIdx = i;
                    break;
                }
            }
        }

        if (shootTrackIdx === -1) {
            // 没找到合适的弹道，则使用第一弹道
            shootTrackIdx = 0;
        }

        // 保存该弹道最后一个弹幕
        this.playedTrackInfo[shootTrackIdx] = barrage;

        return shootTrackIdx;
    }

    /**
     * 获取弹幕文本的默认颜色
     *
     * @private
     * @return {string}
     */
    getDefaultColor() {
        return '#fff';
        // return '#' + Math.floor(Math.random() * 0xffffff).toString(16);
    }

    /**
     * 获取发射的弹幕的信息
     *
     * @private
     * @param {Object} barrage 要发射的弹幕
     * @return {Object}
     */
    getShootBarrageInfo(barrage) {
        let info = Object.assign({}, barrage);
        info.speed = this.getBarrageSpeed();

        // canvas 绘制文字 x,y 坐标是按文字左下角计算
        // 要求 y 取值区间为：[barrageHeight, canvasHeight]
        let barrageHeight = this.barrageHeight;
        let trackIdx = this.getBarrageShootTrackIndex(info);
        info.y = barrageHeight * trackIdx + barrageHeight;

        return info;
    }

    /**
     * 获取弹幕移动的速度
     *
     * @return {number}
     */
    getBarrageSpeed() {
        return 2;
    }

    /**
     * 增加要显示的弹幕
     *
     * @param {Object} barrage 要显示的弹幕信息
     * @return {Object}
     */
    add(barrage) {
        let {text, color, time} = barrage;
        if (!text) {
            return;
        }

        this.initCanvas();

        time = time ? (parseInt(time, 10) || 0) : 0;
        color || (color = this.getDefaultColor());
        let width = Math.ceil(this.ctx.measureText(text).width);

        let toAddBarrage = {
            time,
            text,
            color,
            width,
            x: this.width
        };
        let list = this.allBarrageMap[time];
        list || (this.allBarrageMap[time] = list = []);
        list.push(toAddBarrage);

        return toAddBarrage;
    }

    /**
     * 播放弹幕
     *
     * @param {number=} time 要播放的特定显示时间的弹幕，单位：秒
     */
    play(time) {
        if (typeof time === 'number') {
            time = parseInt(time, 10) || 0;

            // 只添加跟当前播放的时间不同的弹幕，避免重复添加
            if (time !== this.currPlayTime) {
                this.currPlayTime = time;

                let playBarrageList = this.currPlayBarrageList;
                let toPlayList = this.allBarrageMap[time];
                toPlayList && toPlayList.forEach(item => {
                    playBarrageList.push(this.getShootBarrageInfo(item));
                });

                // 如果没有可播放的弹幕，则忽略播放
                if (!playBarrageList.length) {
                    return;
                }
            }
        }

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.initCanvas();
            this.update();
        }
    }

    /**
     * 发送弹幕并显示
     *
     * @param {Object} barrage 发送的弹幕信息
     */
    shoot(barrage) {
        let addedBarrage = this.add(barrage);
        if (!addedBarrage) {
            return;
        }

        let playBarrageList = this.currPlayBarrageList;
        playBarrageList.push(
            this.getShootBarrageInfo(addedBarrage)
        );

        this.play();
    }

    /**
     * 清空弹幕显示
     */
    clear() {
        this.currPlayBarrageList = [];
        this.isPlaying = false;
        this.currPlayTime = null;
        this.playedTrackInfo = {};
        this.ctx && this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 更新弹幕的显示信息
     *
     * @private
     */
    update() {
        if (this.destroyed) {
            return;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        let barrageList = this.currPlayBarrageList;
        let num = barrageList && barrageList.length;
        if (!num) {
            this.isPlaying = false;
            this.currPlayTime = null;
            return;
        }

        for (let i = num - 1; i >= 0; i--) {
            let b = barrageList[i];
            if (b.x + b.width <= 0) {
                barrageList.splice(i, 1);
                b.removed = true; // 标记该弹幕已经被移除
                continue;
            }

            b.x -= b.speed;
            this.drawText(b);
        }

        requestAnimationFrame(this.barrageRenderer);
    }

    /**
     * 绘制弹幕文本
     *
     * @private
     * @param {Object} barrage 要绘制弹幕
     */
    drawText(barrage) {
        this.ctx.fillStyle = barrage.color;
        this.ctx.fillText(barrage.text, barrage.x, barrage.y);
    }

    /**
     * 销毁弹幕
     */
    destroy() {
        this.clear();

        this.destroyed = true;
        this.allBarrageMap = null;
        this.canvas = null;
        this.container = null;
        this.ctx = null;
    }
}
