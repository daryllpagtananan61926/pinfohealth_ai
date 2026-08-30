import { describe, it, expect, beforeEach } from 'vitest';
import { parseUIMarkers, resetUiCount } from '../../src/modules/chat/chat.service.js';

describe('parseUIMarkers', () => {
  beforeEach(() => {
    resetUiCount('test-session');
  });

  it('parses valid breathing-exercise marker', () => {
    const text = 'Here is a breathing exercise [[UI:breathing-exercise:{"cycles":4,"inhale":4,"hold":4,"exhale":6}]] try it';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(1);
    expect(markers[0].component).toBe('breathing-exercise');
    expect(markers[0].props).toEqual({ cycles: 4, inhale: 4, hold: 4, exhale: 6 });
  });

  it('parses valid micro-habit-card marker', () => {
    const text = 'Your micro-step [[UI:micro-habit-card:{"title":"Walk 5 min","duration":"5 minutes"}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(1);
    expect(markers[0].component).toBe('micro-habit-card');
    expect(markers[0].props.title).toBe('Walk 5 min');
  });

  it('parses valid mood-button marker', () => {
    const text = 'How do you feel? [[UI:mood-button:{"options":["😊","😐","😔"]}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(1);
    expect(markers[0].component).toBe('mood-button');
  });

  it('parses valid quick-poll marker', () => {
    const text = 'Choose [[UI:quick-poll:{"question":"Tea or coffee?","options":["Tea","Coffee"]}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(1);
    expect(markers[0].component).toBe('quick-poll');
  });

  it('parses valid grounding-54321 marker', () => {
    const text = 'Ground yourself [[UI:grounding-54321:{"autoStart":true}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(1);
    expect(markers[0].component).toBe('grounding-54321');
  });

  it('rejects unknown component', () => {
    const text = 'Bad [[UI:evil-component:{"foo":"bar"}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(0);
  });

  it('rejects malformed JSON props', () => {
    const text = 'Bad JSON [[UI:breathing-exercise:{not valid json}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(0);
  });

  it('rejects invalid props per schema', () => {
    const text = 'Invalid cycles [[UI:breathing-exercise:{"cycles":0,"inhale":4,"hold":4,"exhale":6}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(0);
  });

  it('returns all valid markers (limit of 1 applied in streamGeminiDeltas)', () => {
    const text = 'First [[UI:breathing-exercise:{"cycles":4,"inhale":4,"hold":4,"exhale":6}]] Second [[UI:mood-button:{"options":["😊","😐"]}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(2);
    expect(markers[0].component).toBe('breathing-exercise');
    expect(markers[1].component).toBe('mood-button');
  });

  it('enforces session UI limit (10 per session)', () => {
    for (let i = 0; i < 10; i++) {
      const text = `Marker ${i} [[UI:breathing-exercise:{"cycles":4,"inhale":4,"hold":4,"exhale":6}]]`;
      const markers = parseUIMarkers(text, 'test-session');
      expect(markers).toHaveLength(1);
    }
    // 11th should be rejected
    const text = 'Marker 11 [[UI:breathing-exercise:{"cycles":4,"inhale":4,"hold":4,"exhale":6}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(0);
  });

  it('separate sessions have separate limits', () => {
    resetUiCount('session-a');
    resetUiCount('session-b');

    for (let i = 0; i < 10; i++) {
      const markers = parseUIMarkers(`[[UI:breathing-exercise:{"cycles":4,"inhale":4,"hold":4,"exhale":6}]]`, 'session-a');
      expect(markers).toHaveLength(1);
    }

    // session-b should still allow
    const markers = parseUIMarkers(`[[UI:breathing-exercise:{"cycles":4,"inhale":4,"hold":4,"exhale":6}]]`, 'session-b');
    expect(markers).toHaveLength(1);
  });

  it('handles marker at start of text', () => {
    const text = '[[UI:breathing-exercise:{"cycles":4,"inhale":4,"hold":4,"exhale":6}]] rest of text';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(1);
  });

  it('handles marker at end of text', () => {
    const text = 'text before [[UI:breathing-exercise:{"cycles":4,"inhale":4,"hold":4,"exhale":6}]]';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(1);
  });

  it('handles marker with whitespace', () => {
    const text = 'text [[UI:breathing-exercise:{"cycles": 4, "inhale": 4, "hold": 4, "exhale": 6}]] text';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(1);
  });

  it('returns empty array for no markers', () => {
    const text = 'Just plain text with no markers';
    const markers = parseUIMarkers(text, 'test-session');
    expect(markers).toHaveLength(0);
  });

  it('handles empty text', () => {
    expect(parseUIMarkers('', 'test-session')).toHaveLength(0);
  });
});