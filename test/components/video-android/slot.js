/**
 * @file Video slot test spec
 * @author wuhuiyao@baidu.com
 */

import sinon from 'sinon';
import {createVideoInstance} from './util';

describe('同层渲染安卓 Video slot', () => {
    describe('video:slot', () => {
        it('should init slot style if slot dom change', done => {
            const component = createVideoInstance();
            const spyInitSlot = sinon.spy(component, 'initSlotChildrenStyle');
            const spyHandleSlotChange = sinon.spy(component, 'handleSlotFullscreenChange');
            const slotEle = component.el.querySelector('.swan-video-slot');
            slotEle.innerHTML = '<div></div>';

            setTimeout(() => {
                expect(spyInitSlot.calledOnce).toBe(true);
                expect(spyHandleSlotChange.notCalled).toBe(true);
                component.dispose();
                done();
            });
        });

        it('should not init slot style if slot not existed', () => {
            const component = createVideoInstance();
            const rawRef = component.ref;
            component.ref = name => {
                if (name === 'slot') {
                    return;
                }
                return rawRef.call(component, name);
            };

            component.initSlot();
            component.initSlotChildrenStyle();
        });

        it('should update slot if slot dom change', done => {
            const component = createVideoInstance();
            const spyInitSlot = sinon.spy(component, 'initSlotChildrenStyle');
            const spyHandleSlotChange = sinon.spy(component, 'handleSlotFullscreenChange');
            const spyLayer = sinon.spy(component.boxjs, 'layer');
            const slotEle = component.el.querySelector('.swan-video-slot');
            component.data.set('__isFullscreen', true);
            slotEle.innerHTML = '<div id="test-xx"></div>';

            setTimeout(() => {
                expect(spyInitSlot.calledOnce).toBe(true);
                expect(spyHandleSlotChange.calledOnce).toBe(true);
                expect(spyLayer.calledOnceWith({
                    name: 'addComponentToFullScreenSync',
                    data: {
                        slaveId: component.slaveId,
                        componentId: ['test-xx']
                    }
                }));
                component.dispose();
                done();
            }, 20);
        });

        it('should init slot style', done => {
            const component = createVideoInstance();
            const slotEle = component.el.querySelector('.swan-video-slot');
            slotEle.innerHTML = '<div></div>';

            setTimeout(() => {
                let child = slotEle.children[0];
                expect(child.style.pointerEvents).toEqual('auto');
                component.dispose();
                done();
            }, 20);
        });
    });

    describe('video:handleSlotFullscreenChange', () => {
        it('should do nothing if slot is not existed', done => {
            const component = createVideoInstance();
            const rawRef = component.ref;
            component.ref = name => {
                if (name === 'slot') {
                    return;
                }
                return rawRef.call(component, name);
            };

            const spyLayer = sinon.spy(component.boxjs, 'layer');
            component.handleSlotFullscreenChange(true);

            setTimeout(() => {
                expect(spyLayer.notCalled).toBe(true);
                component.dispose();
                done();
            }, 20);
        });

        it('should do nothing if slot is empty', done => {
            const component = createVideoInstance();
            const spyLayer = sinon.spy(component.boxjs, 'layer');
            component.handleSlotFullscreenChange(true);

            setTimeout(() => {
                expect(spyLayer.notCalled).toBe(true);
                component.dispose();
                done();
            }, 20);
        });

        it('should call addComponentToFullScreenSync if slot is not empty and fullscreen', () => {
            const component = createVideoInstance();
            const spyLayer = sinon.spy(component.boxjs, 'layer');
            const slotEle = component.el.querySelector('.swan-video-slot');
            slotEle.innerHTML = '<div id="test"></div><swan-template><div id="test2"></div></swan-template>';

            component.handleSlotFullscreenChange(true);

            expect(spyLayer.calledOnceWith({
                name: 'addComponentToFullScreenSync',
                data: {
                    slaveId: component.slaveId,
                    componentId: ['test', 'test2']
                }
            }));

            component.dispose();
        });

        it('should call removeComponentFromFullScreenSync if slot is not empty and not fullscreen', () => {
            const component = createVideoInstance();
            const spyLayer = sinon.spy(component.boxjs, 'layer');
            const slotEle = component.el.querySelector('.swan-video-slot');
            slotEle.innerHTML = '<div id="test"></div>';

            component.handleSlotFullscreenChange(false);

            expect(spyLayer.calledOnceWith({
                name: 'removeComponentFromFullScreenSync',
                data: {
                    slaveId: component.slaveId,
                    componentId: ['test']
                }
            }));

            component.dispose();
        });
    });
});
