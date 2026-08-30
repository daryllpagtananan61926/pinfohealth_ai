import { describe, it, expect } from 'vitest';
import { validateChatBody } from '../../src/modules/chat/chat.routes.js';

describe('chat validation', () => {
  const validBody = {
    sessionId: 'test-session-123',
    messages: [
      { role: 'user', content: 'Hello' },
    ],
  };

  it('accepts valid body', () => {
    const result = validateChatBody(validBody);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('rejects non-object body', () => {
    expect(validateChatBody(null).valid).toBe(false);
    expect(validateChatBody('string').valid).toBe(false);
    expect(validateChatBody([]).valid).toBe(false);
    expect(validateChatBody(123).valid).toBe(false);
  });

  it('rejects missing sessionId', () => {
    const body = { ...validBody, sessionId: undefined };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('sessionId');
  });

  it('rejects empty sessionId', () => {
    const body = { ...validBody, sessionId: '' };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('sessionId');
  });

  it('rejects non-array messages', () => {
    const body = { ...validBody, messages: 'not-array' };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('messages must be an array');
  });

  it('rejects empty messages array', () => {
    const body = { ...validBody, messages: [] };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('messages must not be empty');
  });

  it('rejects too many messages (>20)', () => {
    const body = {
      ...validBody,
      messages: Array(21).fill({ role: 'user', content: 'test' }),
    };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceed 20');
  });

  it('rejects invalid role', () => {
    const body = { ...validBody, messages: [{ role: 'system', content: 'test' }] };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('role must be either');
  });

  it('rejects non-string content', () => {
    const body = { ...validBody, messages: [{ role: 'user', content: 123 }] };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('content must be a string');
  });

  it('rejects content too long (>2000 chars)', () => {
    const body = { ...validBody, messages: [{ role: 'user', content: 'x'.repeat(2001) }] };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceed 2000');
  });

  it('accepts both user and assistant roles', () => {
    const body = {
      ...validBody,
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    };
    const result = validateChatBody(body);
    expect(result.valid).toBe(true);
  });

  it('rejects non-object message', () => {
    const body = { ...validBody, messages: ['not-an-object'] };
    const result = validateChatBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Each message must be an object');
  });
});