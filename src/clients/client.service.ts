/**
 * Client Service
 *
 * Manages client records with:
 * - CRUD operations
 * - Portal access management
 * - Lead-to-client conversion
 */

import type {
  Client,
  ClientAddress,
  ClientListQuery,
  ClientListResult,
  PortalSession,
} from './types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'

// ─── Storage Keys ────────────────────────────────────────────

const KEYS = {
  CLIENTS_INDEX: 'xtx_clients',
  CLIENT: (id: string) => `xtx_client_${id}`,
  PORTAL_TOKEN: (token: string) => `xtx_portal_token_${token}`,
  PORTAL_SESSION: (id: string) => `xtx_portal_session_${id}`,
}

// ─── Service ─────────────────────────────────────────────────

export interface CreateClientInput {
  name: string
  email: string
  phone?: string
  company?: string
  tags?: string[]
  notes?: string
  leadId?: string
  preferredContact?: Client['preferredContact']
  address?: ClientAddress
}

export interface UpdateClientInput {
  name?: string
  email?: string
  phone?: string
  company?: string
  tags?: string[]
  notes?: string
  preferredContact?: Client['preferredContact']
  address?: ClientAddress
  portalEnabled?: boolean
}

export class ClientService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Create a new client
   */
  async create(input: CreateClientInput): Promise<Client> {
    const now = new Date().toISOString()
    const client: Client = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      tags: input.tags ?? [],
      portalEnabled: false,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
      leadId: input.leadId,
      preferredContact: input.preferredContact,
      address: input.address,
    }

    await this.adapter.set(KEYS.CLIENT(client.id), client)

    // Add to index
    const allIds = (await this.adapter.get<string[]>(KEYS.CLIENTS_INDEX)) ?? []
    allIds.unshift(client.id)
    await this.adapter.set(KEYS.CLIENTS_INDEX, allIds)

    console.log(`[Client Created] ${client.email}`, client.id)
    return client
  }

  /**
   * Get client by ID
   */
  async get(id: string): Promise<Client | null> {
    return this.adapter.get<Client>(KEYS.CLIENT(id))
  }

  /**
   * Get client by email
   */
  async getByEmail(email: string): Promise<Client | null> {
    const allIds = (await this.adapter.get<string[]>(KEYS.CLIENTS_INDEX)) ?? []
    for (const id of allIds) {
      const client = await this.get(id)
      if (client?.email.toLowerCase() === email.toLowerCase()) {
        return client
      }
    }
    return null
  }

  /**
   * Update client
   */
  async update(id: string, input: UpdateClientInput): Promise<Client | null> {
    const client = await this.get(id)
    if (!client) return null

    const updated: Client = {
      ...client,
      ...input,
      id: client.id, // Prevent ID change
      createdAt: client.createdAt, // Prevent creation change
      updatedAt: new Date().toISOString(),
    }

    await this.adapter.set(KEYS.CLIENT(id), updated)
    return updated
  }

  /**
   * Delete client
   */
  async delete(id: string): Promise<boolean> {
    const client = await this.get(id)
    if (!client) return false

    // Remove from index
    const allIds = (await this.adapter.get<string[]>(KEYS.CLIENTS_INDEX)) ?? []
    const newIds = allIds.filter((i) => i !== id)
    await this.adapter.set(KEYS.CLIENTS_INDEX, newIds)

    // Remove portal token if exists
    if (client.portalToken) {
      await this.adapter.del(KEYS.PORTAL_TOKEN(client.portalToken))
    }

    // Remove client data
    await this.adapter.del(KEYS.CLIENT(id))

    return true
  }

  /**
   * List clients with filtering
   */
  async list(query?: ClientListQuery): Promise<ClientListResult> {
    const allIds = (await this.adapter.get<string[]>(KEYS.CLIENTS_INDEX)) ?? []
    let clients: Client[] = []

    // Load all clients
    for (const id of allIds) {
      const client = await this.get(id)
      if (client) clients.push(client)
    }

    // Apply filters
    if (query?.search) {
      const searchLower = query.search.toLowerCase()
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.company?.toLowerCase().includes(searchLower),
      )
    }

    if (query?.tags && query.tags.length > 0) {
      clients = clients.filter((c) => query.tags!.some((tag) => c.tags.includes(tag)))
    }

    if (query?.portalEnabled !== undefined) {
      clients = clients.filter((c) => c.portalEnabled === query.portalEnabled)
    }

    // Sort by name
    clients.sort((a, b) => a.name.localeCompare(b.name))

    const total = clients.length
    const offset = query?.offset ?? 0
    const limit = query?.limit ?? 50
    const paginated = clients.slice(offset, offset + limit)

    return {
      clients: paginated,
      total,
      hasMore: offset + paginated.length < total,
    }
  }

  // ─── Portal Access ───────────────────────────────────────

  /**
   * Enable portal access for a client
   */
  async enablePortal(id: string): Promise<{ token: string; expiresAt: string } | null> {
    const client = await this.get(id)
    if (!client) return null

    // Generate token (32-char hex)
    const tokenBytes = new Uint8Array(16)
    crypto.getRandomValues(tokenBytes)
    const token = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Token valid for 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Update client
    await this.update(id, { portalEnabled: true })
    const updated = await this.get(id)
    if (updated) {
      updated.portalToken = token
      updated.portalTokenExpiry = expiresAt
      await this.adapter.set(KEYS.CLIENT(id), updated)
    }

    // Store token -> client mapping
    await this.adapter.set(KEYS.PORTAL_TOKEN(token), { clientId: id, expiresAt })

    return { token, expiresAt }
  }

  /**
   * Disable portal access for a client
   */
  async disablePortal(id: string): Promise<boolean> {
    const client = await this.get(id)
    if (!client) return false

    // Remove token mapping
    if (client.portalToken) {
      await this.adapter.del(KEYS.PORTAL_TOKEN(client.portalToken))
    }

    // Update client
    const updated: Client = {
      ...client,
      portalEnabled: false,
      portalToken: undefined,
      portalTokenExpiry: undefined,
      updatedAt: new Date().toISOString(),
    }
    await this.adapter.set(KEYS.CLIENT(id), updated)

    return true
  }

  /**
   * Validate portal token and create session
   */
  async validatePortalToken(token: string): Promise<PortalSession | null> {
    const tokenData = await this.adapter.get<{ clientId: string; expiresAt: string }>(
      KEYS.PORTAL_TOKEN(token),
    )
    if (!tokenData) return null

    // Check expiry
    if (new Date(tokenData.expiresAt) < new Date()) {
      return null
    }

    const client = await this.get(tokenData.clientId)
    if (!client || !client.portalEnabled) return null

    // Create session
    const session: PortalSession = {
      id: crypto.randomUUID(),
      clientId: client.id,
      email: client.email,
      name: client.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h session
      isValid: true,
    }

    await this.adapter.set(KEYS.PORTAL_SESSION(session.id), session)

    // Update last login
    await this.update(client.id, {})
    const updatedClient = await this.get(client.id)
    if (updatedClient) {
      updatedClient.lastLogin = new Date().toISOString()
      await this.adapter.set(KEYS.CLIENT(client.id), updatedClient)
    }

    return session
  }

  /**
   * Get portal session
   */
  async getPortalSession(sessionId: string): Promise<PortalSession | null> {
    const session = await this.adapter.get<PortalSession>(KEYS.PORTAL_SESSION(sessionId))
    if (!session) return null

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      session.isValid = false
      return session
    }

    return session
  }

  /**
   * Convert a lead to a client
   */
  async convertFromLead(
    leadId: string,
    leadData: { email: string; firstName?: string; lastName?: string; phone?: string; company?: string },
  ): Promise<Client> {
    // Check if client already exists for this email
    const existing = await this.getByEmail(leadData.email)
    if (existing) {
      // Update lead association
      if (!existing.leadId) {
        await this.update(existing.id, {})
        const updated = await this.get(existing.id)
        if (updated) {
          updated.leadId = leadId
          await this.adapter.set(KEYS.CLIENT(existing.id), updated)
        }
      }
      return existing
    }

    // Create new client from lead
    const name = [leadData.firstName, leadData.lastName].filter(Boolean).join(' ') || leadData.email
    return this.create({
      name,
      email: leadData.email,
      phone: leadData.phone,
      company: leadData.company,
      leadId,
    })
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _clientService: ClientService | null = null

export function getClientService(adapter?: StorageAdapter): ClientService {
  if (!_clientService) {
    _clientService = new ClientService(adapter ?? createStorageAdapter())
  }
  return _clientService
}
