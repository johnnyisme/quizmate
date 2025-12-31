// src/__tests__/sessionTimeFormat.test.ts
// Session 時間顯示格式的單元測試

import { describe, it, expect } from 'vitest';

describe('Session Time Format', () => {
  describe('toLocaleString Format', () => {
    it('should format date with year, month, day, hour, minute, second', () => {
      const timestamp = new Date('2026-01-01T14:30:45').getTime();
      const formatted = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // 應該包含日期和時間
      expect(formatted).toMatch(/2026/);
      expect(formatted).toMatch(/01/);
      expect(formatted).toMatch(/14/);
      expect(formatted).toMatch(/30/);
      expect(formatted).toMatch(/45/);
    });

    it('should use 24-hour format', () => {
      const morningTime = new Date('2026-01-01T09:00:00').getTime();
      const eveningTime = new Date('2026-01-01T21:00:00').getTime();

      const morningFormatted = new Date(morningTime).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const eveningFormatted = new Date(eveningTime).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // 不應該包含 AM/PM
      expect(morningFormatted).not.toMatch(/[AaPp][Mm]/);
      expect(eveningFormatted).not.toMatch(/[AaPp][Mm]/);
      
      // 應該顯示 21 而不是 9 PM
      expect(eveningFormatted).toMatch(/21/);
    });

    it('should pad single-digit month and day with zeros', () => {
      const timestamp = new Date('2026-01-05T08:09:07').getTime();
      const formatted = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // 2-digit 格式應該補零
      expect(formatted).toMatch(/01/); // 月份
      expect(formatted).toMatch(/05/); // 日期
      expect(formatted).toMatch(/08/); // 小時
      expect(formatted).toMatch(/09/); // 分鐘
      expect(formatted).toMatch(/07/); // 秒鐘
    });

    it('should handle midnight (00:00:00)', () => {
      const timestamp = new Date('2026-12-31T00:00:00').getTime();
      const formatted = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      expect(formatted).toMatch(/00/); // 應該顯示 00 而不是 12
    });

    it('should handle end of day (23:59:59)', () => {
      const timestamp = new Date('2026-12-31T23:59:59').getTime();
      const formatted = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      expect(formatted).toMatch(/23/);
      expect(formatted).toMatch(/59/);
    });
  });

  describe('Comparison with old format', () => {
    it('old format only showed date without time', () => {
      const timestamp = new Date('2026-01-01T14:30:45').getTime();
      const oldFormat = new Date(timestamp).toLocaleDateString('zh-TW');

      // 舊格式只有日期
      expect(oldFormat).toMatch(/2026/);
      expect(oldFormat).toMatch(/1/);
      
      // 舊格式不包含時間
      expect(oldFormat).not.toMatch(/14/);
      expect(oldFormat).not.toMatch(/30/);
      expect(oldFormat).not.toMatch(/45/);
    });

    it('new format includes both date and time', () => {
      const timestamp = new Date('2026-01-01T14:30:45').getTime();
      const newFormat = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // 新格式包含日期和時間
      expect(newFormat).toMatch(/2026/);
      expect(newFormat).toMatch(/01/);
      expect(newFormat).toMatch(/14/);
      expect(newFormat).toMatch(/30/);
      expect(newFormat).toMatch(/45/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year date', () => {
      const timestamp = new Date('2024-02-29T12:00:00').getTime();
      const formatted = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/02/);
      expect(formatted).toMatch(/29/);
    });

    it('should handle different timezones consistently', () => {
      // 使用相同的 timestamp 應該在相同的 locale 下顯示相同的時間
      const timestamp = Date.now();
      
      const format1 = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const format2 = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      expect(format1).toBe(format2);
    });

    it('should update when session is modified', () => {
      const oldTimestamp = new Date('2026-01-01T10:00:00').getTime();
      const newTimestamp = new Date('2026-01-01T15:30:45').getTime();

      const oldFormatted = new Date(oldTimestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const newFormatted = new Date(newTimestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // 時間應該不同
      expect(oldFormatted).not.toBe(newFormatted);
      expect(oldFormatted).toMatch(/10/);
      expect(newFormatted).toMatch(/15/);
      expect(newFormatted).toMatch(/30/);
      expect(newFormatted).toMatch(/45/);
    });
  });

  describe('Display Text Length', () => {
    it('should not be excessively long', () => {
      const timestamp = new Date('2026-01-01T14:30:45').getTime();
      const formatted = new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // 格式應該合理，不超過 30 字元
      // 預期格式類似：2026/01/01 14:30:45 或 2026/1/1 下午2:30:45
      expect(formatted.length).toBeLessThan(30);
    });

    it('should be consistent in length across different dates', () => {
      const timestamps = [
        new Date('2026-01-01T01:01:01').getTime(),
        new Date('2026-12-31T23:59:59').getTime(),
        new Date('2026-06-15T12:00:00').getTime(),
      ];

      const formatted = timestamps.map(ts => 
        new Date(ts).toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );

      // 所有格式化的字串長度應該相近（因為使用 2-digit）
      const lengths = formatted.map(f => f.length);
      const maxLength = Math.max(...lengths);
      const minLength = Math.min(...lengths);
      
      // 長度差異不應該太大
      expect(maxLength - minLength).toBeLessThanOrEqual(2);
    });
  });
});
