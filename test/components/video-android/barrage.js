/**
 * @file Video barrage test spec
 * @author wuhuiyao@baidu.com
 */

import sinon from 'sinon';
import {createVideoInstance} from './util';

describe('同层渲染安卓 Video barrage', () => {
    it('should not play barrage if danmu is not enabled', () => {
        const component = createVideoInstance({
            data: {
                enableDanmu: false,
                danmuList: [
                    {
                        text: 'a',
                        time: 2
                    }
                ]
            }
        });

        const barrage = component.barrage;
        const spyBarragePlay = sinon.spy(barrage, 'play');
        component.play();
        component.onTimeUpdate({
            target: {
                currentTime: 2
            }
        });

        expect(spyBarragePlay.notCalled).toBe(true);
        component.dispose();
    });

    it('should play barrage', done => {
        const component = createVideoInstance({
            data: {
                enableDanmu: true,
                danmuList: [
                    {
                        text: 'a',
                        time: 2
                    },
                    {
                        text: 'b',
                        time: 2,
                        color: '#ccc'
                    },
                    {
                        text: 'c',
                        time: 3
                    }
                ]
            }
        });
        const barrage = component.barrage;
        barrage.getBarrageSpeed = () => 200;
        expect(!!component.el.querySelector('canvas')).toBe(true);

        component.play();

        component.onTimeUpdate({
            target: {
                currentTime: 1,
                duration: '12'
            }
        });
        expect(barrage.currPlayBarrageList.length).toEqual(0);

        component.onTimeUpdate({
            target: {
                currentTime: 2,
                duration: '12'
            }
        });

        let currPlayBarrageList = barrage.currPlayBarrageList.map(item => {
            let {text, color} = item;
            return {text, color};
        });
        expect(currPlayBarrageList).toEqual([
            {
                text: 'a',
                color: '#fff'
            },
            {
                text: 'b',
                color: '#ccc'
            }
        ]);

        component.sendDanmu({text: 'e', color: '#ddd'});
        currPlayBarrageList = barrage.currPlayBarrageList.map(item => {
            let {text, color} = item;
            return {text, color};
        });
        expect(currPlayBarrageList).toEqual([
            {
                text: 'a',
                color: '#fff'
            },
            {
                text: 'b',
                color: '#ccc'
            },
            {
                text: 'e',
                color: '#ddd'
            }
        ]);

        let allBarrageList = barrage.allBarrageMap[2].map(item => {
            let {text, color} = item;
            return {text, color};
        });
        expect(allBarrageList).toEqual([
            {
                text: 'a',
                color: '#fff'
            },
            {
                text: 'b',
                color: '#ccc'
            },
            {
                text: 'e',
                color: '#ddd'
            }
        ]);

        component.data.set('__playedSeconds', 3);
        component.pause();
        component.sendDanmu({text: 'f', color: '#000'});
        currPlayBarrageList = barrage.currPlayBarrageList.map(item => {
            let {text, color} = item;
            return {text, color};
        });
        expect(currPlayBarrageList).toEqual([
            {
                text: 'a',
                color: '#fff'
            },
            {
                text: 'b',
                color: '#ccc'
            },
            {
                text: 'e',
                color: '#ddd'
            }
        ]);

        allBarrageList = barrage.allBarrageMap[3].map(item => {
            let {text, color} = item;
            return {text, color};
        });
        expect(allBarrageList).toEqual([
            {
                text: 'c',
                color: '#fff'
            },
            {
                text: 'f',
                color: '#000'
            }
        ]);

        setTimeout(() => {
            expect(barrage.currPlayBarrageList.length).toEqual(0);
            component.dispose();
            done();
        }, 50);
    });

    it('should clear barrage when destroyed', () => {
        const component = createVideoInstance({
            data: {
                enableDanmu: true,
                danmuList: [
                    {
                        text: 'a',
                        time: 2
                    }
                ]
            }
        });
        const barrage = component.barrage;
        component.onTimeUpdate({
            target: {
                currentTime: 2,
                duration: '12'
            }
        });
        expect(barrage.currPlayBarrageList.length).toEqual(1);

        component.barrage.destroy();
        expect(barrage.currPlayBarrageList.length).toEqual(0);
        expect(barrage.canvas).toBe(null);
        expect(barrage.container).toBe(null);

        component.dispose();
    });

    it('should not shoot barrage if barrage text empty', () => {
        const component = createVideoInstance({
            data: {
                enableDanmu: true
            }
        });
        const barrage = component.barrage;
        barrage.shoot({text: ''});

        expect(barrage.currPlayBarrageList.length).toEqual(0);
        expect(!!barrage.canvas).toBe(false);

        component.dispose();
    });

    it('should put the track by the order if random track cannot put', () => {
        const component = createVideoInstance({
            data: {
                enableDanmu: true
            }
        });
        const barrage = component.barrage;

        let isFirst = true;
        barrage.isBarrageCanPut = idx => {
            if (isFirst) {
                return false;
            }
            isFirst = false;
            return true;
        };

        barrage.shoot({text: 'abc'});
        expect(barrage.currPlayBarrageList.length).toEqual(1);
        expect(!!barrage.canvas).toBe(true);

        let barrageInfo = barrage.currPlayBarrageList.map(item => {
            let {text, y} = item;
            return {text, y};
        });
        expect(barrageInfo).toEqual(
            [{text: 'abc', y: barrage.barrageHeight}]
        );

        component.dispose();
    });

    it('should resize canvas when container size change', () => {
        const component = createVideoInstance({
            data: {
                enableDanmu: true
            }
        });
        const barrage = component.barrage;

        let isFirst = true;
        barrage.isBarrageCanPut = idx => {
            if (isFirst) {
                return false;
            }
            isFirst = false;
            return idx;
        };

        barrage.shoot({text: 'abc'});
        expect(barrage.currPlayBarrageList.length).toEqual(1);
        expect(!!barrage.canvas).toBe(true);
        expect(barrage.allBarrageMap[0][0].x).toEqual(
            barrage.container.offsetWidth
        );

        barrage.container.style.width = '100px';
        barrage.resize();
        expect(barrage.allBarrageMap[0][0].x).toEqual(
            barrage.container.offsetWidth
        );

        component.dispose();
    });
});
