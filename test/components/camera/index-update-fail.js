// updateFail
// camera 一个页面唯一，只能创建一个，为了模拟创建失败用多个页面
import sinon from 'sinon';
import camera from '../../../src/camera/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
const COMPONENT_NAME = 'camera';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('api update fail', () => {
        const component = buildComponent(
            COMPONENT_NAME,
            camera,
            {
                data: {
                    unitTestParams: {
                        apiExecResult: ['updateFail', 'removeFail']
                    }
                }
            }
        );
        attach2Document(component);

        const spy = sinon.spy(component, 'dispatchErrorEvent');
        it('update fail', done => {
            component.nextTick(() => {
                component.data.set('flash', 'on');
                // test中通过data.set改变字段不会自动触发 slaveRendered，需要手动触发
                component.communicator.fireMessage({
                    type: 'slaveUpdated'
                });
                component.nextTick(() => {
                    expect(spy.callCount).toBe(1);

                    spy.restore();
                    component.dispose();
                    done();
                });
            });
        });
    });
});