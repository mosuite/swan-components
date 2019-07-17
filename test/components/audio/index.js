/**
 * @file audio 组件单测
 * @author  zhuwenxuan@baidu.com
 *          mabin03@baidu.com
 *          yangzongjun@baidu.com
 */

import sinon from 'sinon';
import audio from '../../../src/audio/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {privateKey} from '../../../src/utils';
const COMPONENT_NAME = 'audio';

describe('component [' + COMPONENT_NAME + '] without init data', () => {
    const component = buildComponent(COMPONENT_NAME, audio);
    const $component = attach2Document(component);
    const $swanAudio = $component.querySelector('swan-audio');
    const $innerDiv = $component.querySelector('swan-audio > div');
    componentBaseFieldCheck(COMPONENT_NAME, component);

    it('should be render after attach', () => {
        expect($swanAudio).not.toBe(null);
        expect($innerDiv).not.toBe(null);
    });

    describe('default props', () => {
        it('should has right default props', () => {
            expect($component.querySelector('.swan-audio-title').innerHTML).toEqual('未知音频');
            expect($component.querySelector('.swan-audio-name').innerHTML).toEqual('未知作者');
            expect($swanAudio.getAttribute('poster')).toEqual('');
            expect($swanAudio.getAttribute('src')).toEqual('');
            expect($swanAudio.getAttribute('controls')).toEqual('false');
            expect($swanAudio.getAttribute('loop')).toEqual('false');
        });
    });

    afterAll(() => component.dispose());
});

describe('component [' + COMPONENT_NAME + '] with init data', () => {
    const data = {
        id: 'myAudio',
        poster: 'http://c.hiphotos.baidu.com/super/pic/item/8b13632762d0f703e34c0f6304fa513d2797c597.jpg',
        name: '演员',
        author: '薛之谦',
        src: 'http://vd3.bdstatic.com/mda-ic7mxzt5cvz6f4y5/mda-ic7mxzt5cvz6f4y5.mp3',
        controls: true,
        loop: true
    };
    const component = buildComponent(COMPONENT_NAME, audio, {
        data
    });
    const $component = attach2Document(component);
    const $swanAudio = $component.querySelector('swan-audio');
    const $innerDiv = $component.querySelector('swan-audio > div');
    componentBaseFieldCheck(COMPONENT_NAME, component);

    component.communicator.fireMessage({
        type: 'slaveRendered'
    });

    it('should be render after attach', () => {
        expect($swanAudio).not.toBe(null);
        expect($innerDiv).not.toBe(null);
    });

    it('should has right default props', () => {
        expect($component.querySelector('.swan-audio-title').innerHTML).toEqual(`${data.name}`);
        expect($component.querySelector('.swan-audio-name').innerHTML).toEqual(`${data.author}`);
        expect($swanAudio.getAttribute('poster')).toEqual(`${data.poster}`);
        expect($swanAudio.getAttribute('src')).toEqual(`${data.src}`);
        expect($swanAudio.getAttribute('controls')).toEqual(`${data.controls}`);
        expect($swanAudio.getAttribute('loop')).toEqual(`${data.loop}`);
    });

    it('should call onClick when audio is clicked', done => {
        const spy = sinon.spy(component, 'onClick');
        $component.querySelector('img + span').click();
        expect(spy.called).toBe(true);
        spy.restore();
        done();
    });

    afterAll(() => component.dispose());
});

describe('component [' + COMPONENT_NAME + '] with init data', () => {
    const data = {
        poster: 'http://c.hiphotos.baidu.com/super/pic/item/8b13632762d0f703e34c0f6304fa513d2797c597.jpg',
        name: '演员',
        author: '薛之谦',
        src: 'https://interactive-examples.mdn.mozilla.net/media/examples/t-rex-roar.mp3',
        controls: true,
        loop: true
    };
    const component = buildComponent(COMPONENT_NAME, audio, {
        data
    });
    let $component = attach2Document(component);

    it('should pause while click twice', done => {
        component.nextTick(() => {
            // change src
            component.data.set('src', 'http://asdf.mp3');
            component.audio.onload();
            component.audio.onplay();
            component.audio.ontimeupdate();
            component.audio.onpause();
            component.audio.onended();
            component.audio.onerror({srcElement: {error: {code: 'MEDIA_ERR_ABORTED'}}});
            component.audio.onerror({srcElement: {error: {code: 'MEDIA_ERR_NETWORK'}}});
            component.audio.onerror({srcElement: {error: {code: 'MEDIA_ERR_DECODE'}}});

            const spy = sinon.spy(component, 'onClick');
            component.data.set(`${privateKey}.playState`, 1);
            let $playBtn = $component.querySelector('img + span');
            $playBtn.click();
            expect(spy.callCount).toBe(1);

            component.dispose();
            done();
        });
    });
});
