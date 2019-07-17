/**
 * @file file bdml's file's base elements <map>
 * @author lvlei(lvlei03@baidu.com)
 *         mabin(mabin03@baidu.com)
 *         sunbaixin(sunbaixin@baidu.com)
 */
import style from './index.css';
import {attrValBool, isEqualObject, privateKey, COMPONENT_STATE, isArray} from '../utils';
import {getElementBox} from '../utils/dom';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import cloneDeep from 'lodash.clonedeep';

export default {
    constructor(props) {
        this.scaleMin = 4;
        this.scaleMax = 21;
        this.initScale = 16;
    },

    behaviors: ['nativeEventEffect'],

    initData() {
        return {
            enable3D: false,
            enableRotate: false,
            enableScroll: true,
            enableZoom: true,
            enableOverlooking: false,
            hidden: 'false',
            longitude: null,
            latitude: null,
            scale: 16,
            showCompass: false,
            markers: [],
            polyline: [],
            polygons: [],
            circles: [],
            controls: [],
            includePoints: [],
            showLocation: false,
            subkey: '',
            id: this.id,
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    template: `<swan-map id="{{id}}"
        style="{{hiddenStyle}}"
        data-sanid="{{provideData.componentId}}"
    >
        <div class="slot"><slot></slot></div>
    </swan-map>`,

    computed: {
        ...internalDataComputedCreator([
            {name: 'enable3D', caster: typesCast.boolCast},
            {name: 'enableRotate', caster: typesCast.boolCast},
            {name: 'enableScroll', caster: typesCast.boolCast},
            {name: 'enableZoom', caster: typesCast.boolCast},
            {name: 'enableOverlooking', caster: typesCast.boolCast},
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'showLocation', caster: typesCast.boolCast},
            {name: 'showCompass', caster: typesCast.boolCast},
            {name: 'subkey', caster: typesCast.stringCast}
        ]),

        /**
         * 产出 provideData 供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },
    created() {
        this.initCheckAttr();
        this.nextTick(() => {
            this.openMap();
        });
    },

    attached() {
        this.communicator.onMessage(`map_${this.id}`, event => {
            this.dispatchNaEvent(event.params.action, event.params.e);
        });
    },

    initCheckAttr() {
        this.checkScaleVal(this.scaleMin, this.scaleMax);
    },

    checkScaleVal(min, max) {
        const currentScale = +this.data.get('scale');
        (currentScale < min || currentScale > max) && this.data.set('scale', this.initScale);
    },

    getMapParams() {
        let originalMapData = this.data.get();
        let mapData = cloneDeep(originalMapData);
        mapData = this.transfromIconPath(mapData);
        let data = Object.assign({}, mapData, {
            mapId: this.id,
            slaveId: this.slaveId,
            position: getElementBox(this.el),
            hide: mapData.__hidden,
            showLocation: mapData.__showLocation,
            enable3D: mapData.__enable3D,
            enableRotate: mapData.__enableRotate,
            enableScroll: mapData.__enableScroll,
            enableZoom: mapData.__enableZoom,
            enableOverlooking: mapData.__enableOverlooking,
            showCompass: mapData.__showCompass,
            subkey: mapData.__subkey
        });
        delete data.hidden;
        return data;
    },

    /**
     * iconPath 支持相对路径
     *
     * @param {Object} mapData 用户输入数据
     * @return {Object} 处理过iconPath后的数据
     */
    transfromIconPath(mapData) {
        isArray(mapData.controls) && mapData.controls.forEach(item => {
            item.iconPath && (item.iconPath = this.absolutePathResolve(item.iconPath));
        });
        isArray(mapData.markers) && mapData.markers.forEach(item => {
            item.iconPath && (item.iconPath = this.absolutePathResolve(item.iconPath));
        });
        return mapData;
    },

    openMap() {
        let mapParams = this.getMapParams();
        this.args = {...mapParams};

        this.boxjs.map.insert(mapParams).then(() => {
            this.sendStateChangeMessage('map', COMPONENT_STATE.INSERT, this.data.get('id'), this.id);
        }).catch(err => {
            console.warn(`map open fail! , ${JSON.stringify(err)}`);
        });
    },

    updateMap() {
        if (+this.data.get('scale') > this.scaleMax || +this.data.get('scale') < this.scaleMin) {
            this.checkScaleVal(this.scaleMin, this.scaleMax);
            return;
        }
        let mapParams = this.getMapParams();
        if (!isEqualObject(this.args, mapParams)) {
            if (this.args.scale !== mapParams.scale) {
                mapParams.longitude = null;
                mapParams.latitude = null;
            }
            this.args = mapParams;
            this.boxjs.map.update(mapParams).catch(err => {
                console.warn(`map update fail! , ${JSON.stringify(err)}`);
            });
        }
    },

    removeMap() {
        this.boxjs.map.remove({
            slaveId: this.slaveId,
            mapId: this.id
        }).then(res => {
            this.args = null;
            this.sendStateChangeMessage('map', COMPONENT_STATE.REMOVE, this.data.get('id'), this.id);
        }).catch(err => {
            console.warn(`map remove fail! , ${JSON.stringify(err)}`);
        });
    },

    dispatchCustomEvent(eventName, params) {
        const data = JSON.parse(params.data);
        let eventInfo = {
            details: {}
        };
        switch (eventName) {
            case 'bindmarkertap':
            case 'bindcallouttap':
                eventInfo.markerId = +data.markerId;
                break;
            case 'bindcontroltap':
                eventInfo.controlId = +data.controlId;
                break;
            case 'bindpoitap':
                eventInfo.details = {
                    name: data.name,
                    longitude: data.longitude,
                    latitude: data.latitude
                };
                break;
        }
        this.dispatchEvent(eventName, {
            ...eventInfo
        });
    },

    detached() {
        this.removeMap();
    },

    slaveUpdated() {
        this.args && this.updateMap();
    }
};
