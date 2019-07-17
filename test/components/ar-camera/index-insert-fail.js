// insertFail
// camera 一个页面唯一，只能创建一个，为了模拟创建失败用多个页面
import sinon from 'sinon';
import ARCamera from '../../../src/ar-camera/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'ar-camera';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('api insert fail', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            ARCamera,
            {
                data: {
                    unitTestParams: {
                        apiExecResult: ['insertFail']
                    }
                }
            }
        );
        attach2Document(component);

        const spy = sinon.spy(component.boxjs.media, 'ARCamera');
        const spy2 = sinon.spy(component, 'dispatchErrorEvent');
        it('insert fail', done => {
            component.nextTick(() => {
                expect(spy.calledWith(sinon.match.has('type', sinon.match('insert')))).toBe(true);
                expect(spy2.callCount).toBe(1);

                spy.restore();
                done();
            });
        });
    });
});
