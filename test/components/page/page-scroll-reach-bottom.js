import page from '../../../src/page';
import Button from '../../../src/button/index';
import superCustomComponent from '../../../src/super-custom-component';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';

import sinon from 'sinon';
const COMPONENT_NAME = 'page';

describe('component [' + COMPONENT_NAME + ']', () => {

    describe('should fire message2', () => {
        !global.pageInfo && (global.pageInfo = {});
        global.pageInfo.onReachBottomDistance = -1;

        let testComponent;
        let component;
        function getTestView(options = {}) {
            const componentButton = getComponentClass(
                'button',
                Button,
            );
            const componentPage = getComponentClass(
                'page',
                page,
            );

            const factory = getFactory();
            const properties = {
                classProperties: {
                    components: {
                        button: componentButton,
                        page: componentPage
                    }
                }
            };
            factory.componentDefine(
                'testComponent', {
                    template: `
                        <swan-page>
                            <page s-ref="page" id="id">
                                <button s-ref="button" disabled="{{disabled}}" bindtouchstart="bindtouchstart"
                                        bindtouchmove="bindtouchmove"
                                        bindtap="bindtap"
                                        bindlongpress="bindlongpress"
                                    >
                                    na button
                                </button>
                            </page>
                        </swan-page>`,
                    initData() {
                        return {
                            size: 'default',
                            disabled: true
                        };
                    }
                },
                properties
            );
            return new (factory.getComponents('testComponent'))();
        }

        beforeEach(() => {
            testComponent = getTestView();
            testComponent.attach(document.body);
            component = testComponent.ref('page');
        });
        afterEach(() => {
            testComponent.dispose();
        });

        it('requestComponentObserver add', done => {
            component.nextTick(() => {

                const spy = sinon.spy(component.communicator, 'fireMessage');
                component.initPageEnviromentEvent({});
                component.communicator.fireMessage({
                    type: 'requestComponentObserver',
                    operationType: 'add',
                    value: {
                        slaveId: '',
                        reqId: '',
                        relativeInfo: [{selector: '.a .b'}],
                        options: '',
                        targetSelector: '#id',
                        contextId: '',
                        componentName: 'view'
                    }
                });
                let event = new Event('scroll');
                window.dispatchEvent(event);

                expect(spy.called).toBe(true);
                spy.restore();
                done();
            });
        });
    });
});
