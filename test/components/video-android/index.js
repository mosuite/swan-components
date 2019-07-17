/**
 * @file 同层渲染 安卓 video 组件单测
 * @author wuhuiyao@baidu.com
 */

import sinon from 'sinon';
import {createVideoInstance} from './util';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import './controls';
import './gesture';
import './fullscreen';
import './slot';
import './helper';
import './api';
import './barrage';

const COMPONENT_NAME = 'video';

/* eslint-disable max-nested-callbacks */
describe(`same layer android component [${COMPONENT_NAME}]`, () => {
    describe('video init', () => {
        const component = createVideoInstance();
        componentBaseFieldCheck(COMPONENT_NAME, component);

        afterAll(() => component.dispose());

        it('should be rendered after attach', () => {
            expect(component.el.tagName.toLowerCase()).toBe('swan-video');
            expect(component.el.dataset.swanSameLayer).toEqual('1');
        });

        it('should have one slot', () => {
            expect(component.slot.length).toBe(1);
        });

        it('should has right default props state', () => {
            const data = component.data;
            expect(data.get('controls')).toBe(true);
            expect(data.get('autoplay')).toBe(false);
            expect(data.get('loop')).toBe(false);
            expect(data.get('muted')).toBe(false);
            expect(data.get('objectFit')).toBe('contain');

            expect(data.get('danmuBtn')).toBe(false);
            expect(data.get('enableDanmu')).toBe(false);
            expect(data.get('showMuteBtn')).toBe(true);
            expect(data.get('showPlayBtn')).toBe(true);
            expect(data.get('showCenterPlayBtn')).toBe(true);
            expect(data.get('pageGesture')).toBe(false);
            expect(data.get('enableProgressGesture')).toBe(true);
            expect(data.get('showFullscreenBtn')).toBe(true);
        });

        it('should not exceed 100 for videoPlayedPercent', () => {
            component.data.set('__totalSeconds', 10);
            component.data.set('__playedSeconds', 200);
            expect(component.data.get('videoPlayedPercent')).toEqual(100);
        });

        it('should show progress', done => {
            setTimeout(() => {
                expect(component.data.get('videoShowProgress')).toBe(true);
                done();
            });
        });
    });

    describe('video:hidden', () => {
        const component = createVideoInstance({
            data: {
                hidden: true
            }
        });

        afterAll(() => component.dispose());

        it('should hidden', done => {
            component.nextTick(() => {
                expect(window.getComputedStyle(
                    component.el
                ).getPropertyValue('display')).toEqual('none');
                done();
            });
        });

        it('should update video width when change hidden from true to false', done => {
            component.data.set('hidden', false);
            component.nextTick(() => {
                expect(window.getComputedStyle(
                    component.el
                ).getPropertyValue('display')).toEqual('block');

                setTimeout(() => {
                    expect(component.data.get('__currVideoWidth')).toEqual(
                        component.el.clientWidth
                    );

                    const spyPause = sinon.spy(component, 'pause');
                    component.data.set('hidden', true);
                    component.nextTick(() => {
                        expect(spyPause.calledOnce).toBe(true);
                        done();
                    });
                });
            });
        });
    });

    describe('video:initialTime', () => {
        it('should seek to the initialTime', () => {
            const component = createVideoInstance({
                data: {
                    initialTime: 10
                }
            });
            const spySeek = sinon.spy(component, 'seek');
            component.onLoadedMetaData();
            expect(spySeek.calledWith(10)).toBe(true);
            component.dispose();
        });
    });

    describe('video:showProgress', () => {
        it('should not show progress', done => {
            const component = createVideoInstance({
                data: {
                    showProgress: false
                }
            });

            setTimeout(() => {
                expect(component.data.get('videoShowProgress')).toBe(false);
                component.dispose();
                done();
            });
        });

        it('should not show progress if video width less than 240', done => {
            const component = createVideoInstance();
            component.el.style.width = '239px';

            setTimeout(() => {
                expect(component.data.get('videoShowProgress')).toBe(false);
                component.dispose();
                done();
            });
        });

        it('should show progress if showProgress enabled', done => {
            const component = createVideoInstance({
                data: {
                    showProgress: true
                }
            });
            component.el.style.width = '239px';

            setTimeout(() => {
                expect(component.data.get('videoShowProgress')).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:enableDanmu', () => {
        it('should play danmu when time update', () => {
            const component = createVideoInstance({
                data: {
                    enableDanmu: true
                }
            });
            const spyBarragePlay = sinon.spy(component.barrage, 'play');
            const currentTime = '2.3';
            component.onTimeUpdate({
                target: {
                    currentTime: '2.3',
                    duration: '12'
                }
            });
            expect(spyBarragePlay.calledWith(currentTime)).toBe(true);
            component.dispose();
        });

        it('should not play danmu when time update if not enableDanmu', () => {
            const component = createVideoInstance({
                data: {
                    enableDanmu: false
                }
            });
            const spyBarragePlay = sinon.spy(component.barrage, 'play');
            const currentTime = '2.3';
            component.onTimeUpdate({
                target: {
                    currentTime: '2.3',
                    duration: '12'
                }
            });
            expect(spyBarragePlay.calledWith(currentTime)).toBe(false);
            component.dispose();
        });

        it('should not change enableDanmu state after initialized', () => {
            const component = createVideoInstance({
                data: {
                    enableDanmu: false
                }
            });
            component.data.set('enableDanmu', true);

            const spyBarragePlay = sinon.spy(component.barrage, 'play');
            const currentTime = '2.3';
            component.onTimeUpdate({
                target: {
                    currentTime: '2.3',
                    duration: '12'
                }
            });
            expect(spyBarragePlay.calledWith(currentTime)).toBe(false);
            component.dispose();
        });
    });

    describe('video:danmuBtn', () => {
        it('should show danmu button when enable danmuBtn', done => {
            const component = createVideoInstance({
                data: {
                    danmuBtn: true,
                    enableDanmu: true
                }
            });
            component.play();

            setTimeout(() => {
                expect(
                    component.el.querySelector('.swan-video-i-danmu-enabled')
                ).not.toBe(null);
                component.dispose();
                done();
            });
        });

        it('should not change danmuBtn state after initialized', done => {
            const component = createVideoInstance({
                data: {
                    danmuBtn: false,
                    enableDanmu: true
                }
            });
            component.data.set('danmuBtn', true);
            component.play();

            setTimeout(() => {
                expect(
                    component.el.querySelector('.swan-video-i-danmu-enabled')
                ).toBe(null);
                component.dispose();
                done();
            });
        });

        it('should not show danmu button when not enable danmuBtn', done => {
            const component = createVideoInstance({
                data: {
                    danmuBtn: false,
                    enableDanmu: true
                }
            });
            component.play();

            setTimeout(() => {
                expect(
                    component.el.querySelector('.swan-video-i-danmu-enabled')
                ).toBe(null);
                component.dispose();
                done();
            });
        });
    });

    describe('video:src', () => {
        it('should update video src when src change', done => {
            const component = createVideoInstance({
                data: {
                    src: ''
                }
            });
            component.nextTick(() => {
                const src = 'https://vd3.bdstatic.com/mda-ia8e6q3g23py8qdh/hd/mda-ia8e6q3g23py8qdh.mp4';
                component.data.set(
                    'src', src
                );
                setTimeout(() => {
                    expect(component.data.get('__src')).toEqual(src);
                    component.dispose();
                    done();
                });
            });
        });

        it('should not normalize local video src', () => {
            const localSrc = 'media/test.mp4';
            const component = createVideoInstance({
                data: {
                    src: localSrc
                }
            });
            expect(component.data.get('__src')).toEqual(localSrc);
            component.dispose();
        });
    });

    describe('video:poster', () => {
        it('should update video poster when poster change', done => {
            const component = createVideoInstance({
                data: {
                    poster: ''
                }
            });
            component.nextTick(() => {
                const poster = 'http://localhost/test.png';
                component.data.set(
                    'poster', poster
                );
                setTimeout(() => {
                    expect(component.data.get('__poster')).toEqual(poster);
                    component.dispose();
                    done();
                });
            });
        });

        it('should normalize local video poster', () => {
            const component = createVideoInstance({
                data: {
                    poster: ''
                }
            });
            component.absolutePathResolve = path => path;

            const localPoster = 'media/poster.png';
            component.data.set('poster', localPoster);
            component.nextTick(() => {
                expect(component.data.get('__poster')).toEqual(`file://${localPoster}`);
                component.dispose();
            });
        });
    });

    describe('video:loop', () => {
        it('should update video loop when loop change', done => {
            const component = createVideoInstance({
                data: {
                    loop: false
                }
            });
            expect(!!component.ref('video').loop).toBe(false);

            component.data.set(
                'loop', true
            );
            component.nextTick(() => {
                expect(!!component.ref('video').loop).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:muted', () => {
        it('should update video muted when muted change', done => {
            const component = createVideoInstance({
                data: {
                    muted: false
                }
            });
            expect(!!component.ref('video').muted).toBe(false);

            component.data.set(
                'muted', true
            );
            component.nextTick(() => {
                expect(!!component.ref('video').muted).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:autoplay', () => {
        it('should autoplay when enable autoplay change', done => {
            const component = createVideoInstance({
                data: {
                    autoplay: false
                }
            });
            component.data.set('autoplay', true);
            setTimeout(() => {
                expect(component.data.get('__isPlaying')).toBe(true);
                component.dispose();
                done();
            });
        });

        it('should update autoplay when autoplay', done => {
            const component = createVideoInstance({
                data: {
                    autoplay: true
                }
            });

            setTimeout(() => {
                expect(!!component.ref('video').autoplay).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:toggleControls', () => {
        it('should show controls when video click', done => {
            const component = createVideoInstance();
            component.play();
            expect(component.data.get('__showControls')).toBe(false);

            let spyAutoHideControls = sinon.spy(component, 'initAutoHideControlTask');
            component.onVideoWrapClick();
            component.nextTick(() => {
                expect(spyAutoHideControls.calledOnce).toBe(true);
                expect(component.data.get('__showControls')).toBe(true);
                component.dispose();
                done();
            });
        });

        it('should not show controls when video click if not opened', done => {
            const component = createVideoInstance();

            let spyToggleControls = sinon.spy(component, 'toggleControlShow');
            component.onVideoWrapClick();
            component.nextTick(() => {
                expect(spyToggleControls.calledOnce).toBe(false);
                component.dispose();
                done();
            });
        });
    });

    describe('video:duration', () => {
        it('should update video duration when duration change', done => {
            const component = createVideoInstance();
            expect(component.data.get('__totalSeconds')).toEqual(0);

            component.onDurationChange({target: {duration: 234.5}});
            component.nextTick(() => {
                expect(component.data.get('__totalSeconds')).toEqual(234.5);

                component.onDurationChange({target: {duration: Number.POSITIVE_INFINITY}});
                component.nextTick(() => {
                    expect(component.data.get('__totalSeconds')).toEqual(0);
                    component.dispose();
                    done();
                });
            });
        });
    });

    describe('video:timeupdate', () => {
        it('should update video play progress when time update change', done => {
            const component = createVideoInstance();
            expect(component.data.get('__playedSeconds')).toEqual(0);

            component.onTimeUpdate({target: {currentTime: 1.5}});
            component.nextTick(() => {
                expect(component.data.get('__playedSeconds')).toEqual(1.5);

                component.dispose();
                done();
            });
        });

        it('should trigger time update event when time update change', done => {
            const component = createVideoInstance();

            const spyDispatch = sinon.spy(component, 'dispatchEvent');
            component.onTimeUpdate({target: {
                currentTime: 2,
                duration: 10
            }});
            component.nextTick(() => {
                expect(spyDispatch.calledWithMatch('bindtimeupdate', {
                    detail: {
                        currentTime: 2,
                        duration: 10,
                        videoId: component.data.get('id')
                    }
                })).toBe(true);
                expect(spyDispatch.calledOnce).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:playEnd', () => {
        it('should trigger play end event when play ended', done => {
            const component = createVideoInstance();
            expect(component.data.get('__isPlayEnded')).toBe(false);

            const spyDispatch = sinon.spy(component, 'dispatchEvent');
            component.onPlayEnded();
            component.nextTick(() => {
                expect(spyDispatch.calledWithMatch('bindended', {
                    detail: {
                        videoId: component.data.get('id')
                    }
                })).toBe(true);
                expect(spyDispatch.calledOnce).toBe(true);
                expect(component.data.get('__isPlayEnded')).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:play', () => {
        it('should trigger play event when play', done => {
            const component = createVideoInstance();

            const spyDispatch = sinon.spy(component, 'dispatchEvent');
            component.onPlayStart();
            component.nextTick(() => {
                expect(spyDispatch.calledWithMatch('bindplay', {
                    detail: {
                        videoId: component.data.get('id')
                    }
                })).toBe(true);
                expect(spyDispatch.calledOnce).toBe(true);
                component.dispose();
                done();
            });
        });

        it('should play when call play api', done => {
            const component = createVideoInstance();

            const spyTogglePlay = sinon.spy(component, 'togglePlay');
            component.play();
            setTimeout(() => {
                expect(spyTogglePlay.withArgs(true).calledOnce).toBe(true);
                component.dispose();
                done();
            });
        });

        it('should clear play state when call play api if video has error or ended', done => {
            const component = createVideoInstance();
            component.onPlayEnded();
            expect(component.data.get('__isPlayEnded')).toBe(true);

            const spyTogglePlay = sinon.spy(component, 'togglePlay');
            component.play();
            setTimeout(() => {
                expect(component.data.get('__isPlayEnded')).toBe(false);
                expect(spyTogglePlay.withArgs(true).calledOnce).toBe(true);
                component.dispose();
                done();
            });
        });

        it('should do nothing when call play api if video is playing', done => {
            const component = createVideoInstance();
            const spyTogglePlay = sinon.spy(component, 'togglePlay');
            component.play();
            component.play();
            setTimeout(() => {
                expect(spyTogglePlay.withArgs(true).calledOnce).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:pause', () => {
        it('should trigger pause event when pause', done => {
            const component = createVideoInstance();

            const spyDispatch = sinon.spy(component, 'dispatchEvent');
            component.onPlayPause();
            component.nextTick(() => {
                expect(spyDispatch.calledWithMatch('bindpause', {
                    detail: {
                        videoId: component.data.get('id')
                    }
                })).toBe(true);
                expect(spyDispatch.calledOnce).toBe(true);
                expect(component.data.get('__isPlaying')).toBe(false);
                component.dispose();
                done();
            });
        });

        it('should pause when call pause api', done => {
            const component = createVideoInstance();

            const spyTogglePlay = sinon.spy(component, 'togglePlay');
            component.play();
            component.pause();
            setTimeout(() => {
                expect(spyTogglePlay.withArgs(false).calledOnce).toBe(true);
                component.dispose();
                done();
            });
        });

        it('should do nothing when call pause api if video is not playing', done => {
            const component = createVideoInstance();

            const spyTogglePlay = sinon.spy(component, 'togglePlay');
            component.pause();
            setTimeout(() => {
                expect(spyTogglePlay.calledOnce).toBe(false);
                component.dispose();
                done();
            });
        });
    });

    describe('video:playing', () => {
        it('should update playing state when playing', done => {
            const component = createVideoInstance();
            expect(component.data.get('__isPlaying')).toBe(false);
            component.onPlaying();
            component.nextTick(() => {
                expect(component.data.get('__isPlaying')).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:waiting', () => {
        it('should trigger waiting event when waiting', done => {
            const component = createVideoInstance();
            const spyDispatch = sinon.spy(component, 'dispatchEvent');
            expect(component.data.get('__isPlaying')).toBe(false);
            expect(component.data.get('__showLoading')).toBe(false);

            component.onPlayWaiting();
            component.nextTick(() => {
                expect(spyDispatch.calledWithMatch('bindwaiting', {
                    detail: {
                        videoId: component.data.get('id')
                    }
                })).toBe(true);
                expect(spyDispatch.calledOnce).toBe(true);
                expect(component.data.get('__isPlaying')).toBe(true);
                expect(component.data.get('__showLoading')).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:error', () => {
        it('should not trigger error when src empty', done => {
            const component = createVideoInstance();
            const spyDispatch = sinon.spy(component, 'dispatchEvent');

            component.onPlayError();
            component.nextTick(() => {
                expect(spyDispatch.calledOnce).toBe(false);
                component.dispose();
                done();
            });
        });

        it('should trigger error event when error happen', done => {
            const component = createVideoInstance({
                data: {src: 'http://xxx.mp4'}
            });
            const spyDispatch = sinon.spy(component, 'dispatchEvent');

            component.onPlayError();
            component.nextTick(() => {
                expect(spyDispatch.calledWithMatch('binderror', {
                    detail: {
                        videoId: component.data.get('id')
                    }
                })).toBe(true);
                expect(spyDispatch.calledOnce).toBe(true);
                expect(component.data.get('__isPlayError')).toBe(true);
                component.dispose();
                done();
            });
        });
    });

    describe('video:sendDanmu', () => {
        it('should do nothing when no danmu info', done => {
            const component = createVideoInstance();
            const spyAdd = sinon.spy(component.barrage, 'add');
            const spyShoot = sinon.spy(component.barrage, 'shoot');

            component.sendDanmu();
            component.nextTick(() => {
                expect(spyAdd.calledOnce).toBe(false);
                expect(spyShoot.calledOnce).toBe(false);
                component.dispose();
                done();
            });
        });

        it('should not shoot danmu if playing but not enable danmu', done => {
            const component = createVideoInstance();
            const spyAdd = sinon.spy(component.barrage, 'add');
            const spyShoot = sinon.spy(component.barrage, 'shoot');
            component.play();
            component.nextTick(() => {
                component.sendDanmu({text: 'abc'});
                expect(spyAdd.calledOnceWith({
                    text: 'abc',
                    time: component.data.get('__playedSeconds')
                })).toBe(true);
                expect(spyShoot.calledOnce).toBe(false);
                component.dispose();
                done();
            });
        });

        it('should shoot danmu if playing and enable danmu', done => {
            const component = createVideoInstance({
                data: {enableDanmu: true}
            });
            const spyAdd = sinon.spy(component.barrage, 'add');
            const spyShoot = sinon.spy(component.barrage, 'shoot');
            component.play();
            component.nextTick(() => {
                component.sendDanmu({text: 'abc'});
                expect(spyAdd.calledOnce).toBe(true);
                expect(spyShoot.calledOnceWith({
                    text: 'abc',
                    time: component.data.get('__playedSeconds')
                })).toBe(true);
                component.dispose();
                done();
            });
        });
    });

});
