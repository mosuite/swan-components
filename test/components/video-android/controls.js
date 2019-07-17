/**
 * @file Video controls test spec
 * @author wuhuiyao@baidu.com
 */

import sinon from 'sinon';
import {createVideoInstance, fakeTouchEvent, mockSwanApi} from './util';

describe('同层渲染安卓 Video Controls', () => {
    describe('video:toggleDanmu', () => {
        it('should toggle danmu when click danmu btn', done => {
            const component = createVideoInstance({
                danmuBtn: true
            });
            component.onToggleDanmuShow(fakeTouchEvent());
            component.nextTick(() => {
                expect(component.data.get('__isShowDanmu')).toBe(true);

                const spyClear = sinon.spy(component.barrage, 'clear');
                component.onToggleDanmuShow(fakeTouchEvent());
                component.nextTick(() => {
                    expect(component.data.get('__isShowDanmu')).toBe(false);
                    expect(spyClear.calledOnce).toBe(true);
                    component.dispose();
                    done();
                });
            });
        });
    });

    describe('video:toggleAudio', () => {
        it('should toggle muted when click muted btn', done => {
            const component = createVideoInstance();
            component.onToggleAudio(fakeTouchEvent());
            component.nextTick(() => {
                expect(component.data.get('__isMuted')).toBe(true);

                component.onToggleAudio(fakeTouchEvent());
                component.nextTick(() => {
                    expect(component.data.get('__isMuted')).toBe(false);
                    component.dispose();
                    done();
                });
            });
        });
    });

    describe('video:initNoWifiPlayState', () => {
        it('should execute callback after wifi inited', done => {
            const spyCallback = sinon.spy();
            const spyCallback2 = sinon.spy();

            const component = createVideoInstance();
            const restoreApi = mockSwanApi(component, 'getNetworkType', opts => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        const data = {networkType: 'wifi'};
                        opts.complete && opts.complete(data);
                        opts.success && opts.success(data);

                        resolve();
                    });
                });
            });
            expect(!!component.wifiInited).toBe(false);

            component.initNoWifiPlayState(spyCallback);
            component.initNoWifiPlayState(spyCallback2);

            setTimeout(() => {
                expect(!!component.wifiInited).toBe(true);
                expect(spyCallback.calledOnce).toBe(true);
                expect(spyCallback2.calledOnce).toBe(false);

                const spyCallback3 = sinon.spy();
                component.initNoWifiPlayState(spyCallback3);
                expect(spyCallback3.calledOnce).toBe(true);

                restoreApi();
                component.dispose();
                done();
            }, 5);
        });

        it('should not execute callback if no wifi', done => {
            const spyCallback = sinon.spy();

            const component = createVideoInstance();
            const restoreApi = mockSwanApi(
                component,
                'getNetworkType',
                opts => {
                    let data = {networkType: 'none'};
                    opts.complete && opts.complete(data);
                    opts.success && opts.success(data);
                }
            );
            expect(!!component.wifiInited).toBe(false);

            component.initNoWifiPlayState(spyCallback);
            component.nextTick(() => {
                expect(!!component.wifiInited).toBe(true);
                expect(spyCallback.calledOnce).toBe(false);

                const spyCallback2 = sinon.spy();
                component.initNoWifiPlayState(spyCallback2);
                expect(spyCallback2.calledOnce).toBe(false);
                restoreApi();
                component.dispose();
                done();
            });
        });
    });

    describe('video:goOnPlaying', () => {
        it('should play if click go on playing when network type is not wifi', done => {
            const component = createVideoInstance();
            component.data.set('__showNoWifiTip', true);

            const spyPlay = sinon.spy(component, 'play');
            component.onGoOnPlaying(fakeTouchEvent());
            component.nextTick(() => {
                expect(component.data.get('__showNoWifiTip')).toBe(false);
                expect(spyPlay.calledOnce).toBe(true);

                spyPlay.restore();
                component.dispose();
                done();
            });
        });

        it('should retry to play if click go on playing when network type is none', () => {
            const component = createVideoInstance();
            component.data.set('__showNoWifiTip', true);
            component.data.set('__noNetwork', true);

            const spyPlay = sinon.spy(component, 'play');
            const spyInitWifi = sinon.spy(component, 'initNoWifiPlayState');

            component.onGoOnPlaying(fakeTouchEvent());

            expect(component.data.get('__showNoWifiTip')).toBe(false);
            expect(spyPlay.calledOnce).toBe(true);
            expect(spyInitWifi.calledOnce).toBe(true);

            component.dispose();
        });
    });

    describe('video:togglePlay', () => {
        it('should call play/pause when click play button', () => {
            const component = createVideoInstance();

            const spyPlay = sinon.spy(component, 'play');
            const spyPause = sinon.spy(component, 'pause');

            component.onTogglePlay(fakeTouchEvent());

            expect(spyPlay.calledOnce).toBe(true);
            expect(spyPause.calledOnce).toBe(false);

            component.onTogglePlay(fakeTouchEvent());

            expect(spyPlay.calledOnce).toBe(true);
            expect(spyPause.calledOnce).toBe(true);

            component.dispose();
        });
    });

    describe('video:toggleFullscreen', () => {
        it('should call toggleFullscreen if click fullscreen button', () => {
            const component = createVideoInstance();

            const spyPlay = sinon.spy(component, 'toggleFullscreen');

            component.onToggleFullscreen(fakeTouchEvent());

            expect(spyPlay.calledOnceWith()).toBe(true);

            component.dispose();
        });
    });

    describe('video:fullscreenBack', () => {
        it('should exit fullscreen if click fullscreen back button', () => {
            const component = createVideoInstance();

            const spyPlay = sinon.spy(component, 'toggleFullscreen');

            component.onFullscreenBack(fakeTouchEvent());

            expect(spyPlay.calledOnceWith(false)).toBe(true);

            component.dispose();
        });
    });

    describe('video:fullscreenLock', () => {
        it('should lock fullscreen if click lock fullscreen', () => {
            const component = createVideoInstance();
            expect(component.data.get('__isLockFullscreen')).toBe(false);
            component.onToggleFullscreenLock(fakeTouchEvent());
            expect(component.data.get('__isLockFullscreen')).toBe(true);

            component.onToggleFullscreenLock(fakeTouchEvent());
            expect(component.data.get('__isLockFullscreen')).toBe(false);

            component.dispose();
        });
    });

    describe('video:replay', () => {
        it('should replay if click replay button', () => {
            const component = createVideoInstance();

            const spySeek = sinon.spy(component, 'seek');
            const spyPlay = sinon.spy(component, 'play');

            component.onRePlay(fakeTouchEvent());

            expect(spySeek.calledOnceWith(0)).toBe(true);
            expect(spyPlay.calledOnce).toBe(true);

            component.dispose();
        });
    });
});
