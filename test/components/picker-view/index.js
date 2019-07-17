import pickerView from '../../../src/picker-view/index';
import pickerViewColumn from '../../../src/picker-view-column/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import button from "../../../src/button/index";
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import sinon from 'sinon';
const COMPONENT_NAME = 'pickerView';

describe('component [' + COMPONENT_NAME + ']', () =>{
    const component = buildComponent(COMPONENT_NAME, pickerView);
    const $component = attach2Document(component);
    it('should be rendered after attach', () =>{
        const $pickerView = $component.querySelector('swan-picker-view');
        expect($pickerView).not.toBe(null);
    });
    it('bindchange Be listening', () =>{
        const factory = getFactory();
        const componentPickerView = getComponentClass(COMPONENT_NAME, pickerView);
        const componentPickerViewColumn = getComponentClass('pickerViewColumn', pickerViewColumn);
        const properties = {
            classProperties: {
                components: {
                    'picker-view': componentPickerView,
                    'picker-view-column':componentPickerViewColumn
                }
            }
        };
        factory.componentDefine(
            'swan-picker',
            {
                template: `
                <view>
                   <picker-view value='[0,1,2,3,4,5]' s-ref='pickerview'>
                       <picker-view-column s-ref='pickercolumn'></picker-view-column>
                    </picker-view>
                </view>    
                `
            },
            properties
        ); 
        const componentPicker = factory.getComponents('swan-picker');
        const newPickerViewColumn = new componentPicker();
        newPickerViewColumn.attach(document.body);
        const pickerColumn = newPickerViewColumn.ref('pickercolumn');
        const pickerSpy = sinon.spy(newPickerViewColumn.ref('pickerview'), 'fireBindChange');
        pickerColumn.dispatch('UI:picker-view-column-change');
        expect(pickerSpy.callCount).toBe(1);
    });
});