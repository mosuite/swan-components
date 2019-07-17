import picker from '../../../src/picker/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import {pickerBindChangeEventCallbackFieldCheck} from '../../utils/event-callback-field-check';
import sinon from 'sinon';
const COMPONENT_NAME = 'picker';

describe('component [' + COMPONENT_NAME + ']', () =>{
    const component = buildComponent(COMPONENT_NAME, picker);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    const $picker = $component.querySelector("swan-picker");
    it('should be rendered after attach', () =>{
        expect($component).not.toBe(null);
        expect($picker).not.toBe(null);
    })

    it('should render selector', done => {
        const component2 = buildComponent(COMPONENT_NAME, picker, {
            data: {
                apiExecResult: 'dataFail'
            }
        });
        component2.mode = 'selector';
        component2.data.set('range', ['中国', '美国']);
        component2.data.set('value', 0);
        const spy = sinon.spy(component2.boxjs.ui, 'open');
        component2.fire('bindtap');
        expect(spy.calledOnceWith(sinon.match.has('name', 'utils-picker'))).toBe(true);
        spy.restore();
        done();
    });

    it('should render date', done => {
        const component3 = buildComponent(COMPONENT_NAME, picker);
        component3.mode = 'date';
        component3.data.set('value', '2016-09-01');
        const spy = sinon.spy(component3.boxjs.ui, 'open');
        component3.fire('bindtap');
        expect(spy.calledOnceWith(sinon.match.has('name', 'swan-datePicker'))).toBe(true);
        spy.restore();
        done();
    });
    const component1 = buildComponent(COMPONENT_NAME, picker, {
        data: {
            name: 'myTextarea'
        }
    });
    attach2Document(component1);
    component1.data.set('name', 'aaa');
    it('watch props', done => {
        component1.nextTick(() => {
            expect(component1.name).toBe('aaa');
            component1.dispose();
            done();
        });
    });
    it('should render time', done => {
        const component4 = buildComponent(COMPONENT_NAME, picker);
        component4.mode = 'time';
        component4.data.set('value', '12:01');
        const spy = sinon.spy(component4.boxjs.ui, 'open');
        component4.fire('bindtap');
        expect(spy.calledOnceWith(sinon.match.has('name', 'swan-datePicker'))).toBe(true);
        spy.restore();
        done();
    });

    it('should render multiSelector', done => {
        const component5 = buildComponent(COMPONENT_NAME, picker);
        component5.mode = 'multiSelector';
        component5.data.set('range', [['无脊柱动物', '脊柱动物'], ['扁性动物', '线形动物', '环节动物', '软体动物', '节肢动物'], ['猪肉绦虫', '吸血虫']]);
        component5.data.set('value', [0, 0, 0]);
        const spy = sinon.spy(component5.boxjs.ui, 'open');
        component5.fire('bindtap');
        component5.data.set('value', [1, 1, 1]);
        expect(spy.calledOnceWith(sinon.match.has('name', 'utils-multiPicker'))).toBe(true);
        spy.restore();
        done();
    });

    it('should render region', done => {
        const component6 = buildComponent(COMPONENT_NAME, picker);
        component6.customItem = '全部';
        component6.mode = 'region';
        component6.data.set('value', ['北京市', '市辖区', '东城区'])
        const spy = sinon.spy(component6.boxjs.data, 'get');
        component6.fire('bindtap');
        expect(spy.calledOnceWith(sinon.match.has('name', 'swan-regionData'))).toBe(true);
        spy.restore();
        done();
    });

    it('should handle from reset', () => {
        component.resetFormValue();
        expect(component.data.get('value')).toBe(component.resetValue);
    });

    it('should handle from submit', () => {
        component.data.set('value', 'test')
        expect(component.getFormValue()).toBe('test');
    });
    it('should get default range', () => {
        component.data.set('value', '');
        component.mode = 'region';
        expect(component.getDefaultCurrent()).toEqual([0, 0, 0]);
    });
    it('should get params range', () => {
        component.data.set('value', '');
        const range = ['1', '2'];
        component.mode = '';
        expect(component.getDefaultCurrent(range)).toEqual([0, 0]);
    });

    it('should multiSelector value changed and range changed', done => {
        const component7 = buildComponent(COMPONENT_NAME, picker);
        const spy = sinon.spy(component7.boxjs.ui, 'update');
        component7.data.set('mode', 'multiSelector');
        component7.data.set('range', [['无脊柱动物', '脊柱动物'], ['扁性动物', '线形动物', '环节动物', '软体动物', '节肢动物'], ['猪肉绦虫', '吸血虫']]);
        component7.data.set('value', [0, 0, 0]);
        attach2Document(component7);
        component7.fire('bindtap');
        component7.data.set('range', [['a', 'b'], ['c', 'd'], ['e', 'f']]);
        component7.data.set('value', [1, 1, 1]);
        expect(spy.calledOnceWith(sinon.match.has('name', 'utils-multiPicker')));
        spy.restore();
        component7.dispose();
        done();
    });

    it('should fire bindcolumnchange while columnchange', done => {
        const component8 = buildComponent(COMPONENT_NAME, picker);
        component8.data.set('mode', 'multiSelector');
        component8.data.set('range', [['a', 'b'], ['c', 'd']]);
        component8.data.set('value', [0, 0]);
        attach2Document(component8);
        component8.fire('bindtap');
        component8.on('bindcolumnchange', e => {
            expect(e.detail.value).toBe(1);
            expect(e.detail.column).toBe(0);
            done();
        });
        component8.multiCallback('{"column": 0, "current": 1}');
        component8.dispose();
    });

    it('should fire regionColumnChanged while columnchange', done => {
        const component9 = buildComponent(COMPONENT_NAME, picker);
        component9.data.set('mode', 'region');
        component9.data.set('value', ['天津市', '市辖区', '和平区']);
        attach2Document(component9);
        component9.fire('bindtap');
        component9.nextTick(()=>{
            component9.customItem = '全部';
            component9.updateArea = true;
            component9.regionColumnChanged('{"column": 0, "current": 1}');
            component9.regionColumnChanged('{"column": 1, "current": 1}');
            component9.dispose();
            done();
        });
    });
    it('should fire regionColumnChanged while columnchange', done => {
        const component10 = buildComponent(COMPONENT_NAME, picker);
        component10.data.set('mode', 'region');
        component10.data.set('value', ['天津市', '市辖区', '和平区']);
        attach2Document(component10);
        component10.fire('bindtap');
        component10.nextTick(()=>{
            component10.regionColumnChanged('{"column": 0, "current": 1}');
            component10.regionColumnChanged('{"column": 1, "current": 1}');
            component10.dispose();
            done();
        });
    });
});
describe('picker apifail', () => {
    it('should render region: getDataFail', done => {
        const componentFail = buildComponent(COMPONENT_NAME, picker, {
            data: {
                unitTestParams: {
                    apiExecResult: 'dataFail',
                    openExecResult: 'openFail',
                    updateExecResult: 'updateFail'
                }
            }
        });
        attach2Document(componentFail);
        componentFail.customItem = '全部';
        componentFail.mode = 'region';
        componentFail.data.set('value', ['北京市', '市辖区', '东城区'])
        const spy = sinon.spy(componentFail.boxjs.data, 'get');
        componentFail.nextTick(() => {
            componentFail.fire('bindtap');
            expect(spy.calledOnceWith(sinon.match.has('name', 'swan-regionData'))).toBe(true);
            spy.restore();
            done();
        });
    });
    it('should render selector: openFail', done => {
        const componentFail = buildComponent(COMPONENT_NAME, picker, {
            data: {
                unitTestParams: {
                   openExecResult: 'openFail'
                }
            }
        });
        componentFail.mode = 'selector';
        componentFail.data.set('range', ['中国', '美国']);
        componentFail.data.set('value', 0);
        const spy = sinon.spy(componentFail.boxjs.ui, 'open');
        componentFail.nextTick(() => {
            componentFail.fire('bindtap');
            expect(spy.calledOnceWith(sinon.match.has('name', 'utils-picker'))).toBe(true);
            spy.restore();
            done();
        })

    });
    it('should render date: openFail', done => {
        const componentFail = buildComponent(COMPONENT_NAME, picker, {
            data: {
                unitTestParams: {
                   openExecResult: 'openFail'
                }
            }
        });
        componentFail.mode = 'date';
        componentFail.data.set('value', '2016-09-01');
        const spy = sinon.spy(componentFail.boxjs.ui, 'open');
        componentFail.fire('bindtap');
        expect(spy.calledOnceWith(sinon.match.has('name', 'swan-datePicker'))).toBe(true);
        spy.restore();
        done();
    });
    it('should multiSelector value changed and range changed: openFail', done => {
        const componentFail = buildComponent(COMPONENT_NAME, picker, {
            data: {
                unitTestParams: {
                   updateExecResult: 'updateFail'
                }
            }
        });
        const spy = sinon.spy(componentFail.boxjs.ui, 'update');
        componentFail.data.set('mode', 'multiSelector');
        componentFail.data.set('range', [['无脊柱动物', '脊柱动物'], ['扁性动物', '线形动物', '环节动物', '软体动物', '节肢动物'], ['猪肉绦虫', '吸血虫']]);
        componentFail.data.set('value', [0, 0, 0]);
        attach2Document(componentFail);
        componentFail.fire('bindtap');
        componentFail.data.set('range', [['a', 'b'], ['c', 'd'], ['e', 'f']]);
        componentFail.data.set('value', [1, 1, 1]);
        expect(spy.calledOnceWith(sinon.match.has('name', 'utils-multiPicker')));
        spy.restore();
        componentFail.dispose();
        done();
    });
    it('should fire regionColumnChanged while columnchange: updateFail', done => {
        const componentFail = buildComponent(COMPONENT_NAME, picker, {
            data: {
                unitTestParams: {
                    updateExecResult: 'updateFail',
                    openExecResult: 'openFail'
                }
            }
        });
        const spy = sinon.spy(componentFail.boxjs.ui, 'update');
        componentFail.data.set('mode', 'region');
        componentFail.data.set('value', ['天津市', '市辖区', '和平区']);
        attach2Document(componentFail);

        componentFail.fire('bindtap');
        componentFail.nextTick(()=>{
            componentFail.customItem = '全部';
            componentFail.updateArea = true;
            expect(spy.calledOnceWith(sinon.match.has('name', 'utils-multiPicker')));
            componentFail.regionColumnChanged('{"column": 0, "current": 1}');
            componentFail.regionColumnChanged('{"column": 1, "current": 1}');
            componentFail.dispose();
            done();
        });
    });
    it('should render multiSelector', done => {
        const component5 = buildComponent(COMPONENT_NAME, picker, {
            data: {
                unitTestParams: {
                    openExecResult: 'openFail'
                }
            }
        });
        component5.mode = 'multiSelector';
        component5.data.set('range', [['无脊柱动物', '脊柱动物'], ['扁性动物', '线形动物', '环节动物', '软体动物', '节肢动物'], ['猪肉绦虫', '吸血虫']]);
        component5.data.set('value', [0, 0, 0]);
        const spy = sinon.spy(component5.boxjs.ui, 'open');
        component5.fire('bindtap');
        component5.data.set('value', [1, 1, 1]);
        expect(spy.calledOnceWith(sinon.match.has('name', 'utils-multiPicker'))).toBe(true);
        spy.restore();
        done();
    });
})
