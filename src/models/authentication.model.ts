import {Buffer} from 'node:buffer';
import {Model} from "~/core/index.ts";

export default class AuthenticationModel extends Model {
    public async createRefreshToken(data: {
        tokenHash: Uint8Array;
        userId: number;
        expiresAt: Date,
        ip?: string,
        userAgent?: string
    }) {
        const bufferedToken = Buffer.isBuffer(data.tokenHash) ? data.tokenHash : Buffer.from(data.tokenHash);

        return await this.pool.query(`
            INSERT INTO sessions (tokenHash, userId, expiresAt, ip, userAgent)
            VALUES (?, ?, ?, ?, ?)
        `, [
            bufferedToken,
            data.userId,
            data.expiresAt,
            data.ip ?? null,
            data.userAgent ?? null
        ])
    }

    public async hasActiveRefreshToken(userId: number) {
                const [rows] = await this.pool.query(`
            SELECT COUNT(*) as count
            FROM sessions
            WHERE userId = ? AND expiresAt > NOW() AND revokedAt IS NULL
        `, [userId]);

        return rows[0].count > 0;
    }
}