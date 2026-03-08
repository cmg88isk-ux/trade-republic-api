import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Session Manager - Persist Trade Republic sessions locally
 * Prevents repeated SMS/PIN requests by storing encrypted session tokens
 */

export interface TradeRepublicSession {
  phone: string;
  sessionId: string;
  refreshToken?: string;
  accessToken?: string;
  expiresAt: number;
  createdAt: number;
  lastUsed: number;
  metadata?: {
    deviceId?: string;
    platform?: string;
    userAgent?: string;
  };
}

const SESSIONS_DIR = path.join(process.cwd(), '.tr-sessions');
const ENCRYPTION_KEY = process.env.TR_SESSION_KEY || 'default-key-change-in-prod';

class SessionManager {
  private sessions: Map<string, TradeRepublicSession> = new Map();

  constructor() {
    this.initializeSessionsDirectory();
    this.loadSessions();
  }

  /**
   * Initialize sessions directory
   */
  private initializeSessionsDirectory(): void {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Encrypt session data
   */
  private encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32),
      iv
    );
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt session data
   */
  private decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32),
      iv
    );
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Save session to disk
   */
  saveSession(session: TradeRepublicSession): void {
    const sessionFile = path.join(SESSIONS_DIR, `${session.phone}.json.enc`);
    const sessionData = JSON.stringify(session);
    const encrypted = this.encrypt(sessionData);
    fs.writeFileSync(sessionFile, encrypted, { mode: 0o600 });
    this.sessions.set(session.phone, session);
  }

  /**
   * Load session from disk
   */
  loadSession(phone: string): TradeRepublicSession | null {
    // Check memory first
    if (this.sessions.has(phone)) {
      const session = this.sessions.get(phone)!;
      // Verify session is not expired
      if (session.expiresAt > Date.now()) {
        session.lastUsed = Date.now();
        return session;
      }
    }

    // Check disk
    const sessionFile = path.join(SESSIONS_DIR, `${phone}.json.enc`);
    if (fs.existsSync(sessionFile)) {
      try {
        const encrypted = fs.readFileSync(sessionFile, 'utf8');
        const decrypted = this.decrypt(encrypted);
        const session = JSON.parse(decrypted) as TradeRepublicSession;

        // Verify session is not expired
        if (session.expiresAt > Date.now()) {
          session.lastUsed = Date.now();
          this.sessions.set(phone, session);
          return session;
        }

        // Session expired, delete it
        fs.unlinkSync(sessionFile);
      } catch (error) {
        console.error(`[SessionManager] Failed to load session for ${phone}:`, error);
      }
    }

    return null;
  }

  /**
   * Load all sessions
   */
  private loadSessions(): void {
    try {
      const files = fs.readdirSync(SESSIONS_DIR);
      files.forEach((file) => {
        const phone = file.replace('.json.enc', '');
        this.loadSession(phone);
      });
    } catch (error) {
      console.error('[SessionManager] Failed to load sessions:', error);
    }
  }

  /**
   * Delete session
   */
  deleteSession(phone: string): void {
    const sessionFile = path.join(SESSIONS_DIR, `${phone}.json.enc`);
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
    }
    this.sessions.delete(phone);
  }

  /**
   * Get all valid sessions
   */
  getValidSessions(): TradeRepublicSession[] {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      (session) => session.expiresAt > now
    );
  }

  /**
   * Clear expired sessions
   */
  clearExpiredSessions(): void {
    const now = Date.now();
    Array.from(this.sessions.keys()).forEach((phone) => {
      const session = this.sessions.get(phone)!;
      if (session.expiresAt <= now) {
        this.deleteSession(phone);
      }
    });
  }

  /**
   * Update session token
   */
  updateSessionToken(phone: string, accessToken: string, refreshToken?: string): void {
    const session = this.sessions.get(phone);
    if (!session) {
      throw new Error(`Session not found for phone: ${phone}`);
    }

    session.accessToken = accessToken;
    if (refreshToken) {
      session.refreshToken = refreshToken;
    }
    session.lastUsed = Date.now();
    session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    this.saveSession(session);
  }

  /**
   * Create new session
   */
  createSession(phone: string, sessionId: string, options?: Partial<TradeRepublicSession>): TradeRepublicSession {
    const now = Date.now();
    const session: TradeRepublicSession = {
      phone,
      sessionId,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
      createdAt: now,
      lastUsed: now,
      ...options,
    };

    this.saveSession(session);
    return session;
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

/**
 * Get or create session for phone
 */
export async function getOrCreateSession(
  phone: string,
  createFn?: () => Promise<TradeRepublicSession>
): Promise<TradeRepublicSession | null> {
  let session = sessionManager.loadSession(phone);

  if (!session && createFn) {
    session = await createFn();
    sessionManager.saveSession(session);
  }

  return session || null;
}
