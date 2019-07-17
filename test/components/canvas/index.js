import sinon from 'sinon';
import canvas from '../../../src/canvas/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'canvas';

describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, canvas, {
        data: {
            canvasId: 'canvas-id'
        }
    });
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be render while attach', () => {
        let $swanCanvas = $component.querySelector('swan-canvas');
        let $innerDiv = $component.querySelector('swan-canvas>div');
        expect($swanCanvas).not.toBe(null);
        expect($innerDiv).not.toBe(null);
    });
    it('should has one slot', () => {
        expect(component.slot.length).toBe(1);
    });
    it('should has change attribute while change attribute', () => {
        const stub = sinon.stub(component, 'getCanvasAttributes');
        component.insertCanvas();
        expect(stub.callCount).toBe(1);
    });
    it('should remove while change hidden attribute', done => {
        component.data.set('hidden', true);
        component.nextTick(() => {
            expect($component.querySelector('swan-canvas').style.display).toBe('none');
            done();
        });
    });

    it('should update native component while slaveUpdated', done => {
        const spy = sinon.spy(component.boxjs.canvas, 'update');
        component.el.style.top = '-1px';
        component.slaveUpdated();
        component.nextTick(() => {
            expect(spy.calledOnce).toBe(true);
            spy.restore();
            done();
        });
    });
    it('should handle touchstart event', () => {
        const spy = sinon.spy(component, 'dispatchNaEvent');
        component.communicator.fireMessage({
            type: `canvas_${component.id}`,
            params: {
                action: 'touchstart',
                e: {
                    changedTouches: [
                        {
                            clientX: 10,
                            clientY: 10
                        }
                    ],
                    touches: [
                        {
                            clientX: 10,
                            clientY: 10
                        }
                    ]
                }
            }
        });
        expect(spy.callCount).toBe(1);
        spy.restore();
    });

    const component2 = buildComponent(COMPONENT_NAME, canvas, {
        data: {
            canvasId: 'canvas-id'
        }
    });
    const $component2 = attach2Document(component2);
    it('it should remove canvas while detatched', () => {
        const spy = sinon.spy(component2.boxjs.canvas, 'remove');
        component2.dispose();
        spy.restore();
        expect(spy.calledOnce).toBe(true);
    });
    const component3 = buildComponent(COMPONENT_NAME, canvas);
    const $component3 = attach2Document(component3);
    it('should hide when not has canvasId ', done => {
        component.nextTick(() => {
            expect($component3.querySelector('swan-canvas').style.display).toBe('none');
            done();
        });
    });

});
