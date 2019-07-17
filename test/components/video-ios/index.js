/**
 * @file 同层渲染 ios video 组件单测
 * @author dengxiaohong01@baidu.com
 */

import sinon from 'sinon';
import Video from '../../../src/video-ios';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';

function createVideoInstance(opts) {
    let component = buildComponent('video', Video, opts);
    attach2Document(component);
    return component;
}

const COMPONENT_NAME = 'video';

/* eslint-disable max-nested-callbacks */
describe(`same layer ios component [${COMPONENT_NAME}]`, () => {
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
    });

    // hidden="true"不发送端能力
    describe('video: hidden', () => {
        const component = createVideoInstance({
            data: {
                hidden: true
            }
        });
        afterAll(() => component.dispose());
        it('should not create video', done => {
            const spy = sinon.spy(component.boxjs.media, 'video');
            component.nextTick(() => {
                expect(spy.calledOnceWith(sinon.match.has('type', sinon.match('insert')))).toBe(false);
                spy.restore();
                done();
            });
        });

        it('should call updateContainer when hidden changed', done => {
            // 模拟触发attach
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                const spy = sinon.spy(component.boxjs.ui, 'update');
                component.data.set('hidden', !component.data.get('hidden'));
                // test中通过data.set改变字段不会自动触发 slaveUpdated，需要手动触发
                component.communicator.fireMessage({
                    type: 'slaveUpdated'
                });
                component.nextTick(() => {
                    expect(spy.calledOnceWith(
                        sinon.match.has('name', sinon.match('swan-container'))
                    )).toBe(true);
                    spy.restore();
                    done();
                });
            });
        });
    });

    // 视频起播时间initialTime验证
    describe('video: initialTime', () => {
        const component = createVideoInstance();
        afterAll(() => component.dispose());
        const spy = sinon.spy(component.boxjs.media, 'video');
        component.communicator.fireMessage({
            type: `video_${component.data.get('id')}`,
            params: {
                action: 'timeupdate',
                e: {
                    data: '{"currentTime": "10", "duration": "20", "videoId":"myde"}'
                }
            }
        });
        it('should send correct initialTime', done => {
            component.nextTick(() => {
                expect(spy.calledWith(
                    sinon.match
                        .has('data', sinon.match.has('initialTime', sinon.match(10)))
                )).toBe(true);
                spy.restore();
                done();
            });
        });
    });

    // show-progress属性验证：若不设置，宽度大于240时才会显示
    describe('video: showProgress', () => {
        const component = createVideoInstance();
        component.el.style.width = '239px';
        afterAll(() => component.dispose());
        const spy = sinon.spy(component.boxjs.media, 'video');
        it('should send params with showProgress: false', done => {
            component.nextTick(() => {
                expect(spy.calledWith(
                    sinon.match.has('data', sinon.match.has('showProgress', false))
                )).toBe(true);
                spy.restore();
                done();
            });
        });
    });

    // 弹幕功能
    describe('video danmu', () => {
        const component = createVideoInstance({
            data: {
                enableDanmu: true
            }
        });
        afterAll(() => component.dispose());
        it('should trigger binddanmu events', done => {
            const spy = sinon.spy(component, 'dispatchEvent');
            component.communicator.fireMessage({
                type: `video_${component.data.get('id')}`,
                params: {
                    action: 'danmu',
                    e: {
                        data: '{"ext":"danmu", "videoId":"myde"}'
                    }
                }
            });
            component.nextTick(() => {
                expect(spy.calledOnceWith(component, 'binddanmu'));
                spy.restore();
                done();
            });
        });
    });

    // src
    /* describe('video: src', () => {
        const localSrc = 'media/test.mp4';
        const component = createVideoInstance({
            data: {
                src: localSrc
            }
        });
        afterAll(() => component.dispose());
        const spy = sinon.spy(component.boxjs.media, 'video');

        it('should call open when src change', done => {
            component.data.set('src', 'https://vd3.bdstatic.com/mda-ia8e6q3g23py8qdh/hd/mda-ia8e6q3g23py8qdh.mp4');
            // test中通过data.set改变字段不会自动触发 slaveRendered，需要手动触发
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });

            component.nextTick(() => {
                expect(spy.calledOnceWith(sinon.match.has('type', sinon.match('insert')))).toBe(true);
                spy.restore();
                done();
            });
        });
    }); */

    // 全屏变化
    describe('video: fullscreen', () => {
        const component = createVideoInstance();
        afterAll(() => component.dispose());

        const id = component.data.get('id');

        it('should set fullscreen if data equals "1"', () => {
            component.communicator.fireMessage({
                type: `video_${id}`,
                params: {
                    action: 'fullscreenchange',
                    e: {
                        data: '{"fullscreen":"1", "width":"720", "height":"360", "videoId":"myde"}'
                    }
                }
            });
            component.nextTick(() => {
                component.data.get('isFullScreen', true);
            });
        });

        it('should set half screen if data not equals "1"', () => {
            component.communicator.fireMessage({
                type: `video_${id}`,
                params: {
                    action: 'fullscreenchange',
                    e: {
                        data: '{"fullscreen":"0", "width":"720", "height":"360", "videoId":"myde"}'
                    }
                }
            });
            component.nextTick(() => {
                component.data.get('isFullScreen', false);
            });
        });

        it('should be compatible with lower mobile model', () => {
            component.communicator.fireMessage({
                type: `video_${id}`,
                params: {
                    action: 'fullscreenchange',
                    e: {
                        data: '{"fullscreen":"0", "videoId":"myde"}'
                    }
                }
            });
            component.nextTick(() => {
                component.data.get('isFullScreen', false);
            });
        });

        it('should be compatible with lower mobile model', () => {
            component.communicator.fireMessage({
                type: `video_${id}`,
                params: {
                    action: 'fullscreenchange',
                    e: {
                        data: '{"fullscreen":"1", "videoId":"myde"}'
                    }
                }
            });
            component.nextTick(() => {
                component.data.get('isFullScreen', true);
            });
        });

        it('should trigger bindfullscreenchange events', done => {
            const spy = sinon.spy(component, 'dispatchEvent');
            component.communicator.fireMessage({
                type: `video_${component.data.get('id')}`,
                params: {
                    action: 'fullscreenchange',
                    e: {
                        data: '{"fullscreen":"0", "videoId":"myde"}'
                    }
                }
            });
            component.nextTick(() => {
                expect(spy.calledOnceWith(component, 'bindfullscreenchange'));
                spy.restore();
                done();
            });
        });
    });

    describe('video play', () => {
        const component = createVideoInstance();
        afterAll(() => component.dispose());
        it('should trigger binddanmu events', done => {
            const spy = sinon.spy(component, 'dispatchEvent');
            component.onClickCoverPlay();
            component.nextTick(() => {
                expect(spy.calledOnceWith(component, 'bindplay'));
                spy.restore();
                done();
            });
        });
    });

    describe('video remove', () => {
        const component = createVideoInstance({
            data: {
                duration: 10
            }
        });
        afterAll(() => component.dispose());
        it('should trigger binddanmu events', done => {
            const spy = sinon.spy(component, 'dispatchEvent');
            component.data.get('initialTime', 10);
            component.nextTick(() => {
                expect(spy.calledOnceWith(component, 'bindremove'));
                spy.restore();
                done();
            });
        });
    });

    // open 失败
    describe('video apiFail: openFail', () => {
        const component = createVideoInstance({
            data: {
                unitTestParams: {
                    apiExecResult: 'openFail'
                }
            }
        });
        afterAll(() => component.dispose());
        const spy = sinon.spy(component.boxjs.media, 'video');
        it('should catch', done => {
            component.nextTick(() => {
                expect(spy.calledWith(sinon.match.has('type', sinon.match('insert')))).toBe(true);
                expect(component.isInserted).toBe(false);
                spy.restore();
                done();
            });
        });
    });

    // update 失败
    describe('video apiFail: updateFail', () => {
        const component = createVideoInstance({
            data: {
                unitTestParams: {
                    apiExecResult: 'updateFail'
                }
            }
        });
        afterAll(() => component.dispose());
        it('should catch', done => {
            const spy = sinon.spy(component.boxjs.media, 'video');
            component.data.set('showPlayBtn', false);
            // test中通过data.set改变字段不会自动触发 slaveRendered，需要手动触发
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            component.nextTick(() => {
                expect(spy.calledWith(sinon.match.has('type', sinon.match('update')))).toBe(true);
                spy.restore();
                done();
            });
        });
    });
});
