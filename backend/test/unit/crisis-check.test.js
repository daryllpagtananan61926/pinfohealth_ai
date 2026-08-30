import { describe, it, expect } from 'vitest';
import { checkCrisis } from '../../src/modules/safety/crisis-check.js';

describe('crisis-check', () => {
  describe('self-harm patterns', () => {
    it('detects "kill myself"', () => {
      expect(checkCrisis('I want to kill myself')).toBe(true);
    });

    it('detects "hurt me"', () => {
      expect(checkCrisis('I want to hurt me')).toBe(true);
    });

    it('detects "harm myself"', () => {
      expect(checkCrisis('I want to harm myself')).toBe(true);
    });

    it('detects suicidal language', () => {
      expect(checkCrisis('I want to die')).toBe(true);
      expect(checkCrisis('I want to end my life')).toBe(true);
      expect(checkCrisis('I want to take my life')).toBe(true);
      expect(checkCrisis('suicidal thoughts')).toBe(true);
    });

    it('detects cutting/overdose language', () => {
      expect(checkCrisis('I want to cut myself')).toBe(true);
      expect(checkCrisis('I have pills to overdose')).toBe(true);
      expect(checkCrisis('self-harm is the only way')).toBe(true);
      expect(checkCrisis('self injury')).toBe(true);
    });
  });

  describe('hopelessness with plan', () => {
    it('detects hopelessness + plan combination', () => {
      expect(checkCrisis('I feel hopeless and have a plan to kill myself')).toBe(true);
      expect(checkCrisis('Nothing matters, I have a way to end it')).toBe(true);
      expect(checkCrisis('No point anymore, here is my method for suicide')).toBe(true);
    });

    it('does not trigger on hopelessness alone', () => {
      expect(checkCrisis('I feel hopeless')).toBe(false);
      expect(checkCrisis('Nothing matters anymore')).toBe(false);
      expect(checkCrisis('I give up')).toBe(false);
    });

    it('does not trigger on plan alone without hopelessness', () => {
      expect(checkCrisis('Here is a plan to do something')).toBe(false);
    });
  });

  describe('abuse/danger patterns', () => {
    it('detects abuse language', () => {
      expect(checkCrisis('I am being abused')).toBe(true);
      expect(checkCrisis('I was assaulted')).toBe(true);
      expect(checkCrisis('I was raped')).toBe(true);
      expect(checkCrisis('I was molested')).toBe(true);
    });

    it('detects immediate danger language', () => {
      expect(checkCrisis('I am in immediate danger')).toBe(true);
      expect(checkCrisis('I am unsafe')).toBe(true);
      expect(checkCrisis('He is threatening me')).toBe(true);
      expect(checkCrisis('Domestic violence at home')).toBe(true);
    });
  });

  describe('benign inputs', () => {
    it('does not trigger on normal conversation', () => {
      expect(checkCrisis('I am feeling stressed about exams')).toBe(false);
      expect(checkCrisis('I had a bad day at work')).toBe(false);
      expect(checkCrisis('I feel anxious and overwhelmed')).toBe(false);
      expect(checkCrisis('Can you help me relax?')).toBe(false);
      expect(checkCrisis('I am tired and need a break')).toBe(false);
    });

    it('handles empty/null input safely', () => {
      expect(checkCrisis('')).toBe(false);
      expect(checkCrisis(null)).toBe(false);
      expect(checkCrisis(undefined)).toBe(false);
      expect(checkCrisis(123)).toBe(false);
    });

    it('is case insensitive', () => {
      expect(checkCrisis('I WANT TO KILL MYSELF')).toBe(true);
      expect(checkCrisis('I Want To Die')).toBe(true);
    });
  });
});