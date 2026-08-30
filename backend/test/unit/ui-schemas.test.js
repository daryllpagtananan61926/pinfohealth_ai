import { describe, it, expect } from 'vitest';
import { validateUIComponent, getAllowedComponents, ALLOWED_UI_COMPONENTS } from '../../src/modules/chat/ui-schemas.js';

describe('ui-schemas', () => {
  it('has expected allowed components', () => {
    expect(getAllowedComponents()).toEqual([
      'breathing-exercise',
      'micro-habit-card',
      'mood-button',
      'quick-poll',
      'grounding-54321',
    ]);
    expect(ALLOWED_UI_COMPONENTS.size).toBe(5);
  });

  describe('breathing-exercise', () => {
    it('accepts valid props', () => {
      const result = validateUIComponent('breathing-exercise', {
        cycles: 4,
        inhale: 4,
        hold: 4,
        exhale: 6,
      });
      expect(result.valid).toBe(true);
    });

    it('accepts minimal valid props', () => {
      const result = validateUIComponent('breathing-exercise', {
        cycles: 1,
        inhale: 2,
        hold: 0,
        exhale: 2,
      });
      expect(result.valid).toBe(true);
    });

    it('accepts max valid props', () => {
      const result = validateUIComponent('breathing-exercise', {
        cycles: 20,
        inhale: 10,
        hold: 10,
        exhale: 10,
      });
      expect(result.valid).toBe(true);
    });

    it('rejects missing required fields', () => {
      expect(validateUIComponent('breathing-exercise', {}).valid).toBe(false);
      expect(validateUIComponent('breathing-exercise', { cycles: 4 }).valid).toBe(false);
    });

    it('rejects invalid ranges', () => {
      expect(validateUIComponent('breathing-exercise', { cycles: 0, inhale: 4, hold: 4, exhale: 6 }).valid).toBe(false);
      expect(validateUIComponent('breathing-exercise', { cycles: 21, inhale: 4, hold: 4, exhale: 6 }).valid).toBe(false);
      expect(validateUIComponent('breathing-exercise', { cycles: 4, inhale: 1, hold: 4, exhale: 6 }).valid).toBe(false);
      expect(validateUIComponent('breathing-exercise', { cycles: 4, inhale: 11, hold: 4, exhale: 6 }).valid).toBe(false);
    });

    it('rejects additional properties', () => {
      expect(validateUIComponent('breathing-exercise', { cycles: 4, inhale: 4, hold: 4, exhale: 6, extra: 'bad' }).valid).toBe(false);
    });

    it('rejects wrong types', () => {
      expect(validateUIComponent('breathing-exercise', { cycles: 'four', inhale: 4, hold: 4, exhale: 6 }).valid).toBe(false);
    });
  });

  describe('micro-habit-card', () => {
    it('accepts valid props', () => {
      const result = validateUIComponent('micro-habit-card', {
        title: 'Take a break',
        description: 'Step away for 5 minutes',
        duration: '5 minutes',
      });
      expect(result.valid).toBe(true);
    });

    it('accepts only required title', () => {
      const result = validateUIComponent('micro-habit-card', { title: 'Do something' });
      expect(result.valid).toBe(true);
    });

    it('rejects missing title', () => {
      expect(validateUIComponent('micro-habit-card', {}).valid).toBe(false);
      expect(validateUIComponent('micro-habit-card', { description: 'test' }).valid).toBe(false);
    });

    it('rejects empty title', () => {
      expect(validateUIComponent('micro-habit-card', { title: '' }).valid).toBe(false);
    });

    it('rejects title too long', () => {
      expect(validateUIComponent('micro-habit-card', { title: 'x'.repeat(201) }).valid).toBe(false);
    });

    it('rejects additional properties', () => {
      expect(validateUIComponent('micro-habit-card', { title: 'test', extra: 'bad' }).valid).toBe(false);
    });
  });

  describe('mood-button', () => {
    it('accepts valid props', () => {
      const result = validateUIComponent('mood-button', {
        options: ['😊', '😐', '😔'],
      });
      expect(result.valid).toBe(true);
    });

    it('accepts default options (empty object)', () => {
      const result = validateUIComponent('mood-button', {});
      expect(result.valid).toBe(true);
    });

    it('rejects too few options', () => {
      expect(validateUIComponent('mood-button', { options: ['😊'] }).valid).toBe(false);
    });

    it('rejects too many options', () => {
      expect(validateUIComponent('mood-button', { options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] }).valid).toBe(false);
    });

    it('rejects duplicate options', () => {
      expect(validateUIComponent('mood-button', { options: ['😊', '😊'] }).valid).toBe(false);
    });

    it('rejects non-string options', () => {
      expect(validateUIComponent('mood-button', { options: ['😊', 123] }).valid).toBe(false);
    });

    it('rejects additional properties', () => {
      expect(validateUIComponent('mood-button', { options: ['😊', '😐'], extra: 'bad' }).valid).toBe(false);
    });
  });

  describe('quick-poll', () => {
    it('accepts valid props', () => {
      const result = validateUIComponent('quick-poll', {
        question: 'How are you?',
        options: ['Good', 'Bad'],
      });
      expect(result.valid).toBe(true);
    });

    it('rejects missing question', () => {
      expect(validateUIComponent('quick-poll', { options: ['A', 'B'] }).valid).toBe(false);
    });

    it('rejects missing options', () => {
      expect(validateUIComponent('quick-poll', { question: 'Q?' }).valid).toBe(false);
    });

    it('rejects too few options', () => {
      expect(validateUIComponent('quick-poll', { question: 'Q?', options: ['Only one'] }).valid).toBe(false);
    });

    it('rejects too many options', () => {
      expect(validateUIComponent('quick-poll', { question: 'Q?', options: ['1', '2', '3', '4', '5'] }).valid).toBe(false);
    });

    it('rejects duplicate options', () => {
      expect(validateUIComponent('quick-poll', { question: 'Q?', options: ['Same', 'Same'] }).valid).toBe(false);
    });

    it('rejects additional properties', () => {
      expect(validateUIComponent('quick-poll', { question: 'Q?', options: ['A', 'B'], extra: 'bad' }).valid).toBe(false);
    });
  });

  describe('grounding-54321', () => {
    it('accepts valid props', () => {
      expect(validateUIComponent('grounding-54321', { autoStart: true }).valid).toBe(true);
      expect(validateUIComponent('grounding-54321', { autoStart: false }).valid).toBe(true);
    });

    it('accepts empty object', () => {
      expect(validateUIComponent('grounding-54321', {}).valid).toBe(true);
    });

    it('rejects wrong type', () => {
      expect(validateUIComponent('grounding-54321', { autoStart: 'yes' }).valid).toBe(false);
    });

    it('rejects additional properties', () => {
      expect(validateUIComponent('grounding-54321', { autoStart: true, extra: 'bad' }).valid).toBe(false);
    });
  });

  describe('unknown component', () => {
    it('rejects unknown component', () => {
      const result = validateUIComponent('unknown-component', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown UI component');
    });
  });
});