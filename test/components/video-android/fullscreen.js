/**
 * @file Video fullscreen test spec
 * @author wuhuiyao@baidu.com
 */

import sinon from 'sinon';
import {createVideoInstance} from './util';

describe('同层渲染安卓 Video fullscreen', () => {
    describe('video:fullscreenchange', () => {
        it('should dispatch fullscreen event if fullscreen change', done => {
            const component = createVideoInstance();
            const spyDispatch = sinon.spy(component, 'dispatchEvent');
            component.onFullscreenChangeSuccess({});
            component.nextTick(() => {
                expect(spyDispatch.calledWithMatch('bindfullscreenchange', {
                    detail: {
                        direction: 'vertical',
                        fullscreen: '0',
                        videoId: component.data.get('id')
                    }
                })).toBe(true);
                expect(spyDispatch.calledOnce).toBe(true);
                component.dispose();
                done();
            });
        });

        it('should update barrage and slot if fullscreen change', done => {
            const component = createVideoInstance();
            component.isVideoInFullscreen = () => true;

            const spyDispatch = sinon.spy(component, 'dispatchEvent');
            const spyResize = sinon.spy(component.barrage, 'resize');
            const spyFullscreenChange = sinon.spy(
                component.communicator, 'fireMessage'
            );
            const spySlotChange = sinon.spy(component, 'handleSlotFullscreenChange');

            component.onFullscreenChangeSuccess({});
            setTimeout(() => {
                expect(spyDispatch.calledWithMatch('bindfullscreenchange', {
                    detail: {
                        direction: 'horizontal',
                        fullscreen: '1',
                        videoId: component.data.get('id')
                    }
                })).toBe(true);
                expect(spyDispatch.calledOnce).toBe(true);

                expect(spyResize.calledOnce).toBe(true);
                expect(spySlotChange.calledOnceWith(true)).toBe(true);
                expect(spyFullscreenChange.calledOnceWith({
                    type: 'fullscreenchange',
                    data: {}
                })).toBe(true);

                component.dispose();
                done();
            }, 100);
        });
    });

    describe('video:fullscreenchangeError', () => {
        it('should restore fullscreen state if fullscreen fail', () => {
            const component = createVideoInstance();
            component.isVideoInFullscreen = () => true;
            component.onFullscreenChangeError({});
            expect(component.data.get('__isFullscreen')).toBe(true);

            component.isVideoInFullscreen = () => false;
            component.onFullscreenChangeError({});
            expect(component.data.get('__isFullscreen')).toBe(false);

            component.dispose();
        });
    });

    describe('video:toggleFullscreen', () => {
        it('should toggle fullscreen state if not specified fullscreen param', () => {
            const component = createVideoInstance();
            const spyOrientationListener = sinon.spy(component, 'initDeviceOrientationListener');

            expect(component.data.get('__isFullscreen'), false);
            component.toggleFullscreen();
            expect(spyOrientationListener.calledOnce).toBe(true);
            expect(component.data.get('__isFullscreen'), true);

            component.toggleFullscreen();
            expect(spyOrientationListener.callCount).toEqual(1);
            expect(component.data.get('__isFullscreen'), false);

            component.toggleFullscreen(false);
            expect(component.data.get('__isFullscreen'), false);

            component.dispose();
        });
    });

    describe('video:orientationListener', () => {
        it('should trigger orientation change when device rotate', () => {
            const component = createVideoInstance();
            let spyToggleFullscreen = sinon.spy(component, 'toggleFullscreen');

            // {alpha: zAngle, beta: xAngle, gamma: yAngle}) => {
            // z: [0, 360], x: [-180, 180], y: [-90, 90]
            component.deviceOrientationHandler({alpha: 2, beta: 23, gamma: 62});
            expect(spyToggleFullscreen.calledOnceWith(true)).toBe(true);

            component.deviceOrientationHandler({alpha: 2, beta: 33, gamma: 62});
            expect(spyToggleFullscreen.calledOnceWith(true)).toBe(true);
            spyToggleFullscreen.restore();

            spyToggleFullscreen = sinon.spy(component, 'toggleFullscreen');
            component.deviceOrientationHandler({alpha: 2, beta: 63, gamma: 32});
            expect(spyToggleFullscreen.calledOnceWith(false)).toBe(true);
            component.deviceOrientationHandler({alpha: 2, beta: 73, gamma: 32});
            expect(spyToggleFullscreen.calledOnceWith(false)).toBe(true);

            component.dispose();
        });

        it('should not trigger orientation change if fullscreen lock', () => {
            const component = createVideoInstance();
            component.data.set('__isFullscreen', true);
            component.data.set('__isLockFullscreen', true);

            const spyToggleFullscreen = sinon.spy(component, 'toggleFullscreen');
            component.deviceOrientationHandler({alpha: 2, beta: 23, gamma: 62});
            expect(spyToggleFullscreen.notCalled).toBe(true);

            component.dispose();
        });

        it('should not trigger orientation change if device orientation lock', () => {
            const component = createVideoInstance();
            const rawLayer = component.boxjs.layer;
            component.boxjs.layer = function (opts) {
                let {name} = opts;
                if (name === 'getAutoRotationSync') {
                    return {isRotateOn: false};
                }
            };

            const spyToggleFullscreen = sinon.spy(component, 'toggleFullscreen');
            component.deviceOrientationHandler({alpha: 2, beta: 23, gamma: 62});
            expect(spyToggleFullscreen.notCalled).toBe(true);
            component.boxjs.layer = rawLayer;

            component.dispose();
        });

        it('should only one video listen orientation change if existed multiple videos', () => {
            const component = createVideoInstance();
            const spyToggleFullscreen = sinon.spy(component, 'toggleFullscreen');
            component.initDeviceOrientationListener();
            component.initDeviceOrientationListener();

            component.deviceOrientationHandler({alpha: 2, beta: 23, gamma: 62});
            expect(spyToggleFullscreen.calledOnce).toBe(true);

            const component2 = createVideoInstance();
            const spyToggleFullscreen2 = sinon.spy(component2, 'toggleFullscreen');
            component2.initDeviceOrientationListener();
            component2.initDeviceOrientationListener();

            component.deviceOrientationHandler({alpha: 2, beta: 23, gamma: 62});
            expect(spyToggleFullscreen.calledOnce).toBe(true);

            component2.deviceOrientationHandler({alpha: 2, beta: 23, gamma: 62});
            expect(spyToggleFullscreen2.calledOnce).toBe(true);
        });
    });
});
