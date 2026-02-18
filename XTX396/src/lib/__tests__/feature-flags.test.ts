/**
 * Feature Flags Tests
 * Chain A2 — Tests for feature flag system
 *
 * Tests cover:
 * - Flag defaults
 * - Flag getting/setting
 * - Mode helpers
 * - Flag guards
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_FLAGS,
  getFlags,
  getFlag,
  setFlag,
  setFlags,
  resetFlags,
  isFlagEnabled,
  requireFlag,
  isFounderMode,
  isOpsMode,
  activateFounderMode,
  activateOpsMode,
  areDangerousActionsEnabled,
  requireDangerousAction,
  isTerminalEnabled,
  FeatureFlagDisabledError,
  OWNER_ONLY_FLAGS,
  AUDITED_FLAGS,
  type FeatureFlags,
} from '../feature-flags'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock window events
const dispatchEventMock = vi.fn()
Object.defineProperty(globalThis, 'window', {
  value: {
    dispatchEvent: dispatchEventMock,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
})

describe('Feature Flags', () => {
  beforeEach(() => {
    localStorageMock.clear()
    dispatchEventMock.mockClear()
  })

  describe('DEFAULT_FLAGS', () => {
    it('founderMode is on by default', () => {
      expect(DEFAULT_FLAGS.founderMode).toBe(true)
    })

    it('opsMode is off by default', () => {
      expect(DEFAULT_FLAGS.opsMode).toBe(false)
    })

    it('dangerousActions is off by default', () => {
      expect(DEFAULT_FLAGS.dangerousActions).toBe(false)
    })

    it('terminalEnabled is off by default', () => {
      expect(DEFAULT_FLAGS.terminalEnabled).toBe(false)
    })

    it('debugMode is off by default', () => {
      expect(DEFAULT_FLAGS.debugMode).toBe(false)
    })
  })

  describe('getFlags', () => {
    it('returns default flags when nothing stored', () => {
      const flags = getFlags()
      expect(flags).toEqual(DEFAULT_FLAGS)
    })

    it('returns stored flags merged with defaults', () => {
      localStorageMock.setItem('founder-hub-feature-flags', JSON.stringify({
        opsMode: true,
        newFeature: 'value', // Unknown flag
      }))
      
      const flags = getFlags()
      expect(flags.opsMode).toBe(true)
      expect(flags.founderMode).toBe(true) // Default
    })
  })

  describe('getFlag', () => {
    it('returns specific flag value', () => {
      expect(getFlag('founderMode')).toBe(true)
      expect(getFlag('opsMode')).toBe(false)
    })

    it('returns updated value after setFlag', () => {
      setFlag('opsMode', true)
      expect(getFlag('opsMode')).toBe(true)
    })
  })

  describe('setFlag', () => {
    it('updates a single flag', () => {
      setFlag('debugMode', true)
      expect(getFlag('debugMode')).toBe(true)
    })

    it('dispatches change event', () => {
      setFlag('opsMode', true)
      expect(dispatchEventMock).toHaveBeenCalled()
    })

    it('persists to localStorage', () => {
      setFlag('opsMode', true)
      const stored = JSON.parse(localStorageMock.getItem('founder-hub-feature-flags')!)
      expect(stored.opsMode).toBe(true)
    })
  })

  describe('setFlags', () => {
    it('updates multiple flags at once', () => {
      setFlags({
        opsMode: true,
        founderMode: false,
        debugMode: true,
      })

      expect(getFlag('opsMode')).toBe(true)
      expect(getFlag('founderMode')).toBe(false)
      expect(getFlag('debugMode')).toBe(true)
    })

    it('dispatches change event', () => {
      setFlags({ opsMode: true })
      expect(dispatchEventMock).toHaveBeenCalled()
    })
  })

  describe('resetFlags', () => {
    it('resets all flags to defaults', () => {
      setFlags({
        opsMode: true,
        founderMode: false,
        debugMode: true,
        dangerousActions: true,
      })

      resetFlags()

      expect(getFlags()).toEqual(DEFAULT_FLAGS)
    })

    it('dispatches change event with reset flag', () => {
      resetFlags()
      expect(dispatchEventMock).toHaveBeenCalled()
    })
  })

  describe('isFlagEnabled', () => {
    it('returns true for enabled flags', () => {
      setFlag('debugMode', true)
      expect(isFlagEnabled('debugMode')).toBe(true)
    })

    it('returns false for disabled flags', () => {
      setFlag('debugMode', false)
      expect(isFlagEnabled('debugMode')).toBe(false)
    })
  })

  describe('requireFlag', () => {
    it('does not throw for enabled flag', () => {
      setFlag('debugMode', true)
      expect(() => requireFlag('debugMode')).not.toThrow()
    })

    it('throws FeatureFlagDisabledError for disabled flag', () => {
      setFlag('debugMode', false)
      expect(() => requireFlag('debugMode')).toThrow(FeatureFlagDisabledError)
    })

    it('includes context in error', () => {
      setFlag('terminalEnabled', false)
      try {
        requireFlag('terminalEnabled', 'executing command')
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(FeatureFlagDisabledError)
        expect((e as FeatureFlagDisabledError).context).toBe('executing command')
      }
    })
  })

  describe('Mode helpers', () => {
    describe('isFounderMode', () => {
      it('returns true when founderMode is on and opsMode is off', () => {
        setFlags({ founderMode: true, opsMode: false })
        expect(isFounderMode()).toBe(true)
      })

      it('returns false when opsMode is on', () => {
        setFlags({ founderMode: true, opsMode: true })
        expect(isFounderMode()).toBe(false)
      })
    })

    describe('isOpsMode', () => {
      it('returns true when opsMode is on', () => {
        setFlag('opsMode', true)
        expect(isOpsMode()).toBe(true)
      })

      it('returns false when opsMode is off', () => {
        setFlag('opsMode', false)
        expect(isOpsMode()).toBe(false)
      })
    })

    describe('activateFounderMode', () => {
      it('sets founderMode on and opsMode off', () => {
        setFlags({ founderMode: false, opsMode: true })
        activateFounderMode()
        expect(getFlag('founderMode')).toBe(true)
        expect(getFlag('opsMode')).toBe(false)
      })
    })

    describe('activateOpsMode', () => {
      it('sets opsMode on and founderMode off', () => {
        setFlags({ founderMode: true, opsMode: false })
        activateOpsMode()
        expect(getFlag('founderMode')).toBe(false)
        expect(getFlag('opsMode')).toBe(true)
      })
    })
  })

  describe('Dangerous actions', () => {
    describe('areDangerousActionsEnabled', () => {
      it('returns false by default', () => {
        expect(areDangerousActionsEnabled()).toBe(false)
      })

      it('returns true when enabled', () => {
        setFlag('dangerousActions', true)
        expect(areDangerousActionsEnabled()).toBe(true)
      })
    })

    describe('requireDangerousAction', () => {
      it('throws when dangerous actions disabled', () => {
        setFlag('dangerousActions', false)
        expect(() => requireDangerousAction()).toThrow(FeatureFlagDisabledError)
      })

      it('does not throw when dangerous actions enabled', () => {
        setFlag('dangerousActions', true)
        expect(() => requireDangerousAction()).not.toThrow()
      })
    })
  })

  describe('Terminal access', () => {
    describe('isTerminalEnabled', () => {
      it('returns false by default', () => {
        expect(isTerminalEnabled()).toBe(false)
      })

      it('returns true when enabled', () => {
        setFlag('terminalEnabled', true)
        expect(isTerminalEnabled()).toBe(true)
      })
    })
  })

  describe('Flag categories', () => {
    describe('OWNER_ONLY_FLAGS', () => {
      it('includes dangerous action flags', () => {
        expect(OWNER_ONLY_FLAGS).toContain('dangerousActions')
        expect(OWNER_ONLY_FLAGS).toContain('terminalEnabled')
      })

      it('includes debug flags', () => {
        expect(OWNER_ONLY_FLAGS).toContain('debugMode')
        expect(OWNER_ONLY_FLAGS).toContain('mockData')
      })
    })

    describe('AUDITED_FLAGS', () => {
      it('includes security-sensitive flags', () => {
        expect(AUDITED_FLAGS).toContain('dangerousActions')
        expect(AUDITED_FLAGS).toContain('terminalEnabled')
        expect(AUDITED_FLAGS).toContain('opsMode')
      })
    })
  })

  describe('FeatureFlagDisabledError', () => {
    it('includes flag name in error', () => {
      const error = new FeatureFlagDisabledError('debugMode')
      expect(error.flag).toBe('debugMode')
      expect(error.message).toContain('debugMode')
    })

    it('includes context when provided', () => {
      const error = new FeatureFlagDisabledError('terminalEnabled', 'running tests')
      expect(error.context).toBe('running tests')
      expect(error.message).toContain('running tests')
    })
  })
})
