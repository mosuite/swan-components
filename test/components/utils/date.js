/**
 * @file date
 * @author yangzongjun@baidu.com
 */

import sinon from 'sinon';
import {formatTime} from '../../../src/utils/date';

describe('utils date', () => {
    it('formatTime', () => {
        expect(formatTime()).toEqual('00:00');
    });
    it('hour < 0', () => {
        expect(formatTime(3600 - 1)).toEqual('59:59');
    });
    it('hour < 0 & miniute < 10', () => {
        expect(formatTime(61)).toEqual('01:01');
    });
    it('hour < 0 & seconds < 10', () => {
        expect(formatTime(1)).toEqual('00:01');
    });

    it('hour > 0', () => {
        expect(formatTime(3600 + 1)).toEqual('01:00:01');
    });
    it('hour > 0', () => {
        expect(formatTime(3600 * 10)).toEqual('10:00:00');
    });
    it('hour > 0 & minutes > 10', () => {
        expect(formatTime(3600 + 600)).toEqual('01:10:00');
    });
    it('hour > 0 & seconds > 10', () => {
        expect(formatTime(3600 + 11)).toEqual('01:00:11');
    });
});
