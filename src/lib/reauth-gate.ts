/**
 * Re-authentication Gate
 *
 * Requires password re-entry for dangerous or owner-only actions.
 * Caches the re-auth stamp for 5 minutes to avoid repeated prompts
 * during a single admin session.
 */

import { kv } from './local-storage-kv'
import { hashPasswordPBKDF2, hashPasswordLegacy } from './crypto'

const REAUTH_KEY = 'founder-hub-reauth-stamp'
const REAUTH_WINDOW = 5 * 60 * 1000 // 5 minutes

/**
 * Check whether the user has recently re-authenticated.
 */
export async function isReauthValid(): Promise<boolean> {
  const stamp = await kv.get<number>(REAUTH_KEY)
  if (!stamp) return false
  return Date.now() - stamp < REAUTH_WINDOW
}

/**
 * Verify the user's password and set a re-auth stamp.
 * Returns true if password is valid.
 */
export async function verifyReauth(
  password: string,
  storedHash: string,
  storedSalt?: string,
): Promise<boolean> {
  let valid = false

  if (storedSalt) {
    const { hash } = await hashPasswordPBKDF2(password, storedSalt)
    valid = hash === storedHash
  } else {
    const legacyHash = await hashPasswordLegacy(password)
    valid = legacyHash === storedHash
  }

  if (valid) {
    await kv.set(REAUTH_KEY, Date.now())
  }
  return valid
}

/**
 * Clear the re-auth stamp (e.g. on logout).
 */
export async function clearReauth(): Promise<void> {
  await kv.delete(REAUTH_KEY)
}
