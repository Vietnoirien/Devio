import { describe, it, expect } from 'vitest';
import { getFileType } from './DocumentRenderer';

describe('DocumentRenderer', () => {
    it('should map file extensions correctly', () => {
        expect(getFileType('test.ts')).toBe('typescript');
        expect(getFileType('test.json')).toBe('json');
        expect(getFileType('test.md')).toBe('markdown');
    });
});
