/**
 * @file Video gesture test spec
 * @author wuhuiyao@baidu.com
 */

import sinon from 'sinon';
import {createVideoInstance, fakeTouchEvent} from './util';

describe('同层渲染安卓 Video Gesture', () => {
    describe('video:progressGesture', () => {
        it('should update play progress', done => {
            const component = createVideoInstance();

            const spyStopEvent = sinon.spy(component, 'stopDefaultEvent');
            component.onPageGestureTouchEnd(fakeTouchEvent());
            expect(spyStopEvent.notCalled).toBe(true);
            spyStopEvent.restore();

            component.onPageGestureTouchStart(fakeTouchEvent());
            component.onPageGestureTouchMove(fakeTouchEvent({x: 10, y: 0}));
            expect(component.data.get('__isPageGestureUpProgress')).toBe(false);

            let seekSpy = sinon.spy(component, 'seek');
            component.play();

            component.onPageGestureTouchStart(fakeTouchEvent());
            component.onPageGestureTouchMove(fakeTouchEvent({x: 10, y: 0}));
            expect(component.data.get('__isPageGestureUpProgress')).toBe(false);

            const totalSeconds = 50;
            component.data.set('__totalSeconds', totalSeconds);
            expect(component.data.get('__isPageGestureUpProgress')).toBe(false);

            component.onPageGestureTouchStart(fakeTouchEvent());
            component.onPageGestureTouchMove(fakeTouchEvent({x: 2, y: 0}));
            expect(component.gestureDirection).toBe(null);

            component.onPageGestureTouchMove(fakeTouchEvent({x: 22, y: 0}));
            setTimeout(() => {
                component.onPageGestureTouchMove(fakeTouchEvent({x: 20, y: 10}));
                component.onPageGestureTouchMove(fakeTouchEvent({x: 40, y: 3}));
                expect(component.data.get('__isPageGestureProgressForward')).toBe(true);
                const currPlayedSecs = component.data.get('__playedSeconds');
                expect(currPlayedSecs > 0).toBe(true);

                // ignore time update
                component.onTimeUpdate({
                    target: {
                        currentTime: 2.3
                    }
                });
                expect(component.data.get('__playedSeconds')).toEqual(currPlayedSecs);

                // played seconds max range
                component.onPageGestureTouchMove(fakeTouchEvent({x: 540, y: 3}));
                expect(component.data.get('__isPageGestureProgressForward')).toBe(true);
                expect(component.data.get('__playedSeconds')).toEqual(totalSeconds);

                // played seconds min range
                component.onPageGestureTouchMove(fakeTouchEvent({x: -540, y: 3}));
                expect(component.data.get('__isPageGestureProgressForward')).toBe(false);
                expect(component.data.get('__playedSeconds')).toEqual(0);

                component.nextTick(() => {
                    expect(component.data.get('__isPageGestureUpProgress')).toBe(true);
                    expect(component.gestureDirection).toEqual('x');
                    expect(seekSpy.notCalled).toBe(true);

                    component.onPageGestureTouchEnd(fakeTouchEvent({x: 50, y: 0}));
                    component.nextTick(() => {
                        expect(component.data.get('__isPageGestureUpProgress')).toBe(false);
                        expect(seekSpy.calledOnce).toBe(true);

                        component.dispose();
                        done();
                    });
                });
            });
        });

        it('should not update play progress if disable progress gesture', done => {
            const component = createVideoInstance({
                data: {
                    enableProgressGesture: false
                }
            });

            component.play();
            const totalSeconds = 50;
            component.data.set('__totalSeconds', totalSeconds);
            expect(component.data.get('__isPageGestureUpProgress')).toBe(false);

            component.onPageGestureTouchStart(fakeTouchEvent());
            component.onPageGestureTouchMove(fakeTouchEvent({x: 10, y: 0}));
            setTimeout(() => {
                component.onPageGestureTouchMove(fakeTouchEvent({x: 20, y: 10}));
                component.onPageGestureTouchMove(fakeTouchEvent({x: 40, y: 3}));
                expect(component.data.get('__isPageGestureProgressForward')).toBe(false);
                const currPlayedSecs = component.data.get('__playedSeconds');
                expect(currPlayedSecs).toEqual(0);

                // time update
                component.onTimeUpdate({
                    target: {
                        currentTime: 2.3
                    }
                });
                expect(component.data.get('__playedSeconds')).toEqual(2.3);
                component.dispose();
                done();
            });
        });

        it('should do nothing if enable progress gesture', () => {
            const component = createVideoInstance();
            const spySetProgress = sinon.spy(component, 'setPlayProgress');
            component.onProgressTouchEnd(fakeTouchEvent());
            expect(spySetProgress.notCalled).toBe(true);

            const spyUpProgress = sinon.spy(component, 'updatePlayedSeconds');
            component.onProgressTouchMove(fakeTouchEvent());
            expect(spyUpProgress.notCalled).toBe(true);

            component.dispose();
        });
    });

    describe('video:voiceGesture', () => {
        it('should update voice percent', done => {
            const component = createVideoInstance({
                data: {pageGesture: true}
            });
            component.play();
            const touchInitX = 1000;
            expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(false);

            component.onPageGestureTouchStart(fakeTouchEvent({x: touchInitX}));
            component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: 20}));
            setTimeout(() => {
                expect(component.gestureDirection).toEqual('y');
                component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: 10}));
                component.onPageGestureTouchMove(fakeTouchEvent({x: 10, y: 23}));
                expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(true);
                expect(component.data.get('__isUpLightState')).toBe(false);

                // voice min range
                component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: 2333}));
                expect(component.data.get('__voicePercent')).toEqual(0);
                expect(component.data.get('__isMuted')).toBe(true);

                // voice max range
                component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: -1333}));
                expect(component.data.get('__voicePercent')).toEqual(100);
                expect(component.data.get('__isMuted')).toBe(false);

                component.nextTick(() => {
                    expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(true);
                    expect(component.gestureDirection).toEqual('y');

                    component.onPageGestureTouchEnd(fakeTouchEvent({x: 50, y: 0}));
                    component.nextTick(() => {
                        expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(false);
                        component.dispose();
                        done();
                    });
                });
            });
        });

        it('should not update voice percent if disable page gesture', done => {
            const component = createVideoInstance();
            component.play();
            const touchInitX = 1000;
            expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(false);

            component.onPageGestureTouchStart(fakeTouchEvent({x: touchInitX}));
            component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: 20}));
            setTimeout(() => {
                expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(false);

                component.dispose();
                done();
            });
        });
    });

    describe('video:lightGesture', () => {
        it('should update light percent', done => {
            const component = createVideoInstance({
                data: {pageGesture: true}
            });
            component.play();
            const touchInitX = 0;
            expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(false);

            component.onPageGestureTouchStart(fakeTouchEvent({x: touchInitX}));
            component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: 20}));
            setTimeout(() => {
                expect(component.gestureDirection).toEqual('y');
                component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: 10}));
                component.onPageGestureTouchMove(fakeTouchEvent({x: 510, y: 23}));
                expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(true);
                expect(component.data.get('__isUpLightState')).toBe(true);

                // light min range
                component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: 2333}));
                expect(component.data.get('__lightPercent')).toEqual(0);

                // light max range
                component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: -1333}));
                expect(component.data.get('__lightPercent')).toEqual(100);

                component.nextTick(() => {
                    expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(true);
                    expect(component.gestureDirection).toEqual('y');

                    component.onPageGestureTouchEnd(fakeTouchEvent({x: 50, y: 0}));
                    component.nextTick(() => {
                        expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(false);
                        component.dispose();
                        done();
                    });
                });
            });
        });

        it('should not update light percent if disable page gesture', done => {
            const component = createVideoInstance();
            component.play();
            const touchInitX = 1000;
            expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(false);

            component.onPageGestureTouchStart(fakeTouchEvent({x: touchInitX}));
            component.onPageGestureTouchMove(fakeTouchEvent({x: touchInitX, y: 20}));
            setTimeout(() => {
                expect(component.data.get('__isPageGestureUpVoiceLight')).toBe(false);

                component.dispose();
                done();
            });
        });
    });

    describe('video:progressSlider', () => {
        it('should update play slider progress', done => {
            const component = createVideoInstance({
                data: {
                    showProgress: true
                }
            });
            component.onProgressTouchStart(fakeTouchEvent());
            expect(component.data.get('__isProgressSliderFocus')).toBe(false);

            component.initAutoHideControlTask = () => {};
            component.play();
            component.toggleControlShow(true);
            component.toggleControlShow = () => {};

            let seekSpy = sinon.spy(component, 'seek');

            const totalSeconds = 50;
            component.data.set('__totalSeconds', totalSeconds);
            setTimeout(() => {
                component.onProgressTouchStart(fakeTouchEvent({clientX: 0}));
                component.onProgressTouchMove(fakeTouchEvent({clientX: 10}));
                expect(component.data.get('__isProgressSliderFocus')).toBe(true);

                component.onProgressTouchMove(fakeTouchEvent({clientX: 20}));
                component.onProgressTouchMove(fakeTouchEvent({clientX: 340}));
                expect(component.data.get('__isProgressSliderFocus')).toBe(true);
                const currPlayedSecs = component.data.get('__playedSeconds');
                expect(currPlayedSecs > 0).toBe(true);

                // ignore time update
                component.onTimeUpdate({
                    target: {
                        currentTime: 2.3
                    }
                });
                expect(component.data.get('__playedSeconds')).toEqual(currPlayedSecs);

                // played seconds max range
                component.onProgressTouchMove(fakeTouchEvent({clientX: 5340}));
                expect(component.data.get('__playedSeconds')).toEqual(totalSeconds);

                // played seconds min range
                component.onProgressTouchMove(fakeTouchEvent({clientX: -540}));
                expect(component.data.get('__playedSeconds')).toEqual(0);

                expect(seekSpy.notCalled).toBe(true);

                component.onProgressTouchEnd(fakeTouchEvent({clientX: 50}));
                component.nextTick(() => {
                    expect(component.data.get('__isProgressSliderFocus')).toBe(false);
                    expect(seekSpy.calledOnce).toBe(true);

                    component.dispose();
                    done();
                });
            });
        });

        it('should update play slider progress when click', done => {
            const component = createVideoInstance({
                data: {
                    showProgress: true
                }
            });

            component.initAutoHideControlTask = () => {};
            component.play();
            component.toggleControlShow(true);
            component.toggleControlShow = () => {};

            let seekSpy = sinon.spy(component, 'seek');

            const totalSeconds = 50;
            component.data.set('__totalSeconds', totalSeconds);
            setTimeout(() => {
                component.onProgressClick(fakeTouchEvent({clientX: 500}, true));

                const currPlayedSecs = component.data.get('__playedSeconds');
                expect(currPlayedSecs > 0).toBe(true);
                expect(seekSpy.calledOnce).toBe(true);

                component.dispose();
                done();
            });
        });
    });
});
