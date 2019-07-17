/**
 * @file bdml's file's base elements <picker>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import style from './index.css';
import {isDiffArray, privateKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
export default {
    behaviors: ['form', 'userTouchEvents', 'noNativeBehavior'],
    constructor(props) {
        this.name = this.data.get('name');
    },
    initData() {
        return {
            range: [],
            rangeKey: '',
            mode: 'selector',
            value: 0,
            disabled: false,
            start: '',
            end: '',
            fields: 'day',
            customItem: '',
            title: '设置',
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'range', caster: typesCast.arrayCast},
            {name: 'rangeKey', caster: typesCast.stringCast},
            {name: 'mode', caster: typesCast.stringCast},
            {name: 'disabled', caster: typesCast.boolCast},
            {name: 'start', caster: typesCast.stringCast},
            {name: 'end', caster: typesCast.stringCast},
            {name: 'fields', data: ['day', 'month', 'year']},
            {name: 'customItem', caster: typesCast.stringCast},
            {name: 'title', caster: typesCast.stringCast}
        ]),

        /**
         * 产出 provideData 供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },
    template: `<swan-picker
        mode="{{__mode}}"
        disabled="{{__disabled}}"
        data-sanid="{{provideData.componentId}}">
        <slot></slot>
    </swan-picker>`,

    compiled() {
        this.bindAction('bindtap', e => {
            this.initPickerData();
        });
    },
    attached() {
        this.mode = this.data.get('__mode');
        this.resetValue = this.data.get('value');
        this.watchParams();
        this.watch('name', name => {
            this.reRegisterFormItem(this.name);
            this.name = name;
        });
    },

    /**
     * 监听数据变化
     */
    watchParams() {
        if (this.mode === 'multiSelector') {
            this.watch('value', val => {
                if (!val || val.length === 0 || !this.oldValue || !this.oldRange) {
                    return;
                }
                this.multiValueChanged();
            });
            this.watch('range', val => {
                if (!val || val.length === 0 || !this.oldValue || !this.oldRange) {
                    return;
                }
                this.multiRangeChanged();
            });
        }
    },

    /**
     * 初始化选择器数据
     * 只有多列、省市区选择器需要记录旧数据用于做数据对比调用update端能力
     */
    initPickerData() {
        const pageData = this.data.get();
        if (this.mode === 'selector') {
            return this.renderPicker();
        }
        if (this.mode === 'multiSelector') {
            this.oldValue = Array.isArray(pageData.value) ? pageData.value : [0, 0, 0];
            this.oldRange = Array.isArray(pageData.__range) ? pageData.__range : [];
            this.oldRangeKey = typeof pageData.__rangeKey === 'string' ? pageData.__rangeKey : '';
            return this.renderPicker();
        }
        if (this.mode === 'time' || this.mode === 'date') {
            this.value = typeof pageData.value === 'string' ? pageData.value : '';
            this.start = typeof pageData.__start === 'string' ? pageData.__start : '';
            this.end = typeof pageData.__end === 'string' ? pageData.__end : '';
            this.fields = ['day', 'month', 'year'].includes(pageData.__fields) ? pageData.__fields : 'month';
            return this.renderPicker();
        }
        if (this.mode === 'region') {
            this.updateArea = true;
            this.customItem = typeof pageData.__customItem === 'string' ? pageData.__customItem : '';
            this.boxjs.data.get({
                name: 'swan-regionData'
            }).then(res => {
                if (res && res.content) {
                    this.regionList = res.content;
                    this.getProvinces();
                    this.renderPicker();
                }
            }).catch(err => {
                console.warn('GetRegionData Fail::' + JSON.stringify(err));
            });
        }
    },

    /**
     * 表单获取值
     * @return {string} picker值
     */
    getFormValue() {
        return this.data.get('value');
    },

    /**
     * 重置表单值
     */
    resetFormValue() {
        this.data.set('value', this.resetValue);
        this.dispatchEvent('bindchange', {
            detail: {
                value: this.resetValue
            }
        });
    },

    /**
     * 根据mode渲染选择器
     * selector：普通选择器、multiSelector：多列选择器
     * time：时间选择器、date：日期选择器、region：省市区选择器
     */
    renderPicker() {
        if (this.data.get('__disabled')) {
            return;
        }
        switch (this.mode) {
            case 'selector':
                this.renderSelectorPicker();
                break;
            case 'multiSelector':
                this.renderMultiSelectorPicker();
                break;
            case 'time':
                this.renderDatePicker();
                break;
            case 'date':
                this.renderDatePicker();
                break;
            case 'region':
                this.renderRegionSelectorPicker();
                break;
        }
    },

    /**
     * 普通选择器
     */
    renderSelectorPicker() {
        let {value, __range, __rangeKey, __title} = this.data.get();
        value = parseInt(value, 10) || 0;
        (value < 0 || value >= __range.length) && (value = 0);
        // 构建选项数组
        const rangeArray = __range.map(item => {
            return __rangeKey ? item[__rangeKey] : item;
        });
        this.boxjs.ui.open({
            name: 'utils-picker',
            data: {
                title: __title,
                array: rangeArray,
                current: value
            }
        }).then(res => {
            if (res && res.value !== undefined) {
                this.dispatchEvent('bindchange', {
                    detail: {
                        value: parseInt(res.value, 10)
                    }
                });
                this.data.set('value', parseInt(res.value, 10));
            } else {
                this.dispatchEvent('bindcancel');
            }
        }).catch(err => {
            console.warn('SelectorPicker Fail::' + JSON.stringify(err));
        });
    },

    /**
     * 日期、时间选择器
     */
    renderDatePicker() {
        this.boxjs.ui.open({
            name: 'swan-datePicker',
            data: {
                start: this.start,
                end: this.end,
                mode: this.mode,
                value: this.value,
                fields: this.fields
            }
        }).then(res => {
            if (res && res.value !== undefined) {
                this.dispatchEvent('bindchange', {
                    detail: {
                        value: res.value
                    }
                });
                this.data.set('value', res.value);
            } else {
                this.dispatchEvent('bindcancel');
            }
        }).catch(err => {
            console.warn('DatePicker Fail::' + JSON.stringify(err));
        });
    },

    /**
     * 多列选择器
     */
    renderMultiSelectorPicker() {
        const rangeArray = this.oldRange.map((item, index) => {
            return item.map(data => {
                return this.oldRangeKey ? data[this.oldRangeKey] : data;
            });
        });
        this.multiCallback = this.multiColumnChanged.bind(this);
        this.boxjs.ui.open({
            name: 'utils-multiPicker',
            data: {
                title: this.data.get('__title'),
                callback: this.multiCallback,
                array: rangeArray,
                current: this.getCurrent()
            }
        }).then(res => {
            if (res && res.value !== undefined) {
                const value = res.value.map(item => +item);
                this.oldValue = value;
                this.data.set('value', value);
                this.dispatchEvent('bindchange', {
                    detail: {
                        value: value
                    }
                });
                this.data.set('value', value);
            } else {
                this.dispatchEvent('bindcancel');
            }
        }).catch(err => {
            console.warn('MultiPicker Fail::' + JSON.stringify(err));
        });
    },

    /**
     * 省市区选择器
     */
    renderRegionSelectorPicker() {
        const regions = this.regions;
        this.regionCallback = this.regionColumnChanged.bind(this);
        this.boxjs.ui.open({
            name: 'utils-multiPicker',
            data: {
                title: this.data.get('__title'),
                callback: this.regionCallback,
                array: regions,
                current: this.getCurrent()
            }
        }).then(res => {
            if (res && res.value !== undefined) {
                let value = res.value;
                let detailVaule = [regions[0][+value[0]], regions[1][+value[1]], regions[2][+value[2]]];
                this.dispatchEvent('bindchange', {
                    detail: {
                        value: detailVaule,
                        postcode: '',
                        code: []
                    }
                });
                this.data.set('value', detailVaule);
            } else {
                this.dispatchEvent('bindcancel');
            }
        }).catch(err => {
            console.warn('RegionPicker Fail::' + JSON.stringify(err));
        });
    },

    /**
     * 获取多列选择器、省市区选择器默认选中项集合
     * @param {Array} range 多列选择器数据
     * @return {Array} 选中的索引集合
     */
    getDefaultCurrent(range) {
        if (this.mode === 'region') {
            return [0, 0, 0];
        }
        return range.map(() => {
            return 0;
        });
    },

    /**
     * 获取选中项索引，初始化渲染、value和range值变化都会调用
     * @return {Array} 选中的索引集合
     */
    getCurrent() {
        const value = this.data.get('value');
        const range = Array.isArray(this.data.get('range')) ? this.data.get('range') : [];
        if (!value || !Array.isArray(value) || value.length === 0) {
            return this.getDefaultCurrent(range);
        }
        if (this.mode === 'multiSelector') {
            return value.map((item, index) => {
                let curIndex = parseInt(item, 10) || 0;
                (curIndex < 0 || curIndex >= this.data.get('__range')[index].length) && (curIndex = 0);
                return curIndex;
            });
        }
        return this.regions.map((item, index) => {
            const curItem = value[index];
            if (item.includes(curItem)) {
                return item.indexOf(curItem);
            }
            return 0;
        });
    },

    /**
     * 解析区域数据，获取省份
     */
    getProvinces() {
        this.regions = [];
        this.regions[0] = [];
        this.customItem && this.regions[0].push(this.customItem);
        this.regionList.forEach((region, index) => {
            this.regions[0].push(region.name);
        });
        let provinceName = Array.isArray(this.data.get('value')) ? this.data.get('value')[0] : '';
        provinceName = this.regions[0].includes(provinceName) ? provinceName : this.regions[0][0];
        this.getCitysByProvince(provinceName);
    },

    /**
     * 根据省份获取市
     * @param {string} provinceName 省份
     */
    getCitysByProvince(provinceName) {
        this.regions[1] = [];
        let cityName = Array.isArray(this.data.get('value')) ? this.data.get('value')[1] : '';
        const data = this.regionList.filter(region => {
            return region.name === provinceName;
        });
        let city = {};
        if (this.customItem) {
            this.regions[1].push(this.customItem);
        } else {
            city = data[0].children[0];
        }
        data[0] && data[0].children.map(child => {
            this.regions[1].push(child.name);
            if (child.name === cityName) {
                city = child;
            }
        });
        this.getAreasByCity(city);
    },

    /**
     * 根据市获取区域
     * @param {Object} city 市
     */
    getAreasByCity(city) {
        this.regions[2] = [];
        this.customItem && this.regions[2].push(this.customItem);
        city.children && city.children.map(child => {
            this.regions[2].push(child.name);
        });
    },

    /**
     * 多列选择器value值变化,value是数组
     * @param {number} index 索引
     * @return {boolean} 终止程序
     */
    multiValueChanged(index = 0) {
        const newVal = Array.isArray(this.data.get('value')) ? this.data.get('value') : [];
        const oldVal = Array.isArray(this.oldValue) ? this.oldValue : [];
        if (newVal[index] !== oldVal[index]) {
            this.multiUpdatePickerColumn(index);
        }
        index++;
        if (index >= newVal.length) {
            this.oldValue = newVal;
            return false;
        }
        this.multiValueChanged(index);
    },

    /**
     * 多列选择器range、rangeKey值变化
     * @param {number} index 索引
     * @return {boolean} 终止程序
     */
    multiRangeChanged(index = 0) {
        const newRange = this.data.get('__range');
        const newRangeKey = this.data.get('__rangeKey');
        if (isDiffArray(newRange[index], this.oldRange[index], newRangeKey)) {
            this.multiUpdatePickerColumn(index);
        }
        index++;
        if (index >= newRange.length) {
            this.oldRange = newRange;
            this.oldRangeKey = newRangeKey;
            return false;
        }
        this.multiRangeChanged(index);
    },

    /**
     * 多列选择器调用端能力修改每列选项值
     * @param {number} index 数据索引
     */
    multiUpdatePickerColumn(index) {
        const range = this.data.get('__range');
        const rangeKey = this.data.get('__rangeKey');
        const current = this.getCurrent()[index];
        const array = range[index].map(item => {
            return rangeKey ? item[rangeKey] + '' : item + '';
        });
        this.boxjs.ui.update({
            name: 'utils-multiPicker',
            data: {
                column: index,
                array: array,
                current: current
            }
        }).then(e => {
            this.oldValue[index] = current;
            this.data.set('value[' + index + ']', current);
        }).catch(err => {
            console.warn('updatePicker Fail::' + JSON.stringify(err));
        });
    },

    /**
     * 省市区选择器调用端能力修改每列选项值
     * @param {number} index 列索引
     */
    regionUpdatePickerColumn(index) {
        const current = this.getCurrent()[index];
        this.boxjs.ui.update({
            name: 'utils-multiPicker',
            data: {
                column: index,
                array: this.regions[index],
                current: current
            }
        }).catch(err => {
            console.warn('updatePicker Fail::' + JSON.stringify(err));
        });
    },

    /**
     * 获取省市区数据和默认值，省市区默认值如：['北京市', '市辖区', '海淀区']
     * @param {string} name 地区名称
     * @param {Object} columnIndex 列索引
     * @return {Array} 默认值集合
     */
    getRegionsValue(name, columnIndex) {
        if (columnIndex === 0) { // 省份修改
            this.data.set('value', [name, this.regions[1][0], this.regions[2][0]]);
            return this.getCitysByProvince(name);
        }
        const value = this.data.get('value');
        if (columnIndex === 1) { // 市
            let city = '';
            this.regionList
            .filter(region => {
                return region.name === value[0];
            })[0].children.filter(child => {
                if (child.name === name) {
                    city = child;
                }
            });
            this.data.set('value', [value[0], name, this.regions[2][0]]);
            return this.getAreasByCity(city);
        }
        this.data.set('value', [value[0], value[1], name]);
    },

    /**
     * 多列选择器选择列值回调方法
     * @param {Object} e 数据对象
     */
    multiColumnChanged(e) {
        e = JSON.parse(e);
        this.dispatchEvent('bindcolumnchange', {
            detail: {
                value: e.current,
                column: e.column
            }
        });
    },

    /**
     * 省市区选择器选择列值回调方法
     * 选择省需要更新市、区，选择市只需要更新区，选择区不需要更新数据
     * @param {Object} e 数据对象
     */
    regionColumnChanged(e) {
        e = JSON.parse(e);
        this.getRegionsValue(this.regions[e.column][e.current], e.column);
        if (e.column === 0) { // 省份
            this.regionUpdatePickerColumn(1);
            if (!this.customItem) {
                this.regionUpdatePickerColumn(2);
            } else if (this.updateArea) {
                this.regionUpdatePickerColumn(2);
                this.updateArea = false;
            }
        } else if (e.column === 1) { // 市
            this.updateArea = true;
            this.regionUpdatePickerColumn(2);
        }
    }
};