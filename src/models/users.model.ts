import {Connection} from "npm:mysql2@3.13.0/typings/mysql/index.d.ts";
import {Logger} from "~/core/classes/logger.class.ts";
import {Injectable, Model} from "~/core/index.ts";
import {UserRegistration} from "~/interfaces/user.interface.ts";

@Injectable()
export default class UserModel extends Model {

    public getUserById(id: unknown) {
        // This method should fetch and return a user by ID
        return { id: id, name: 'Alice' };
    }

    public async getUserByUsername(username: string) {
        // This method should fetch and return a user by ID
        const results = await this.pool.query(`
            SELECT
                u.id, u.email, u.username, u.password, u.lastName, u.firstName, u.lastLogin, u.createdAt, u.verifiedAt
            FROM users u
            WHERE username = ?
            LIMIT 1
        `, [username])

                return results[0][0] ?? null;
    }

    public getUsers(limit = 500, offset = 0) {
        // This method should fetch and return multiple users
        return this.pool.query(`
            SELECT
                u.id, u.email, u.username, u.lastName, u.firstName, u.lastLogin, u.createdAt, u.verifiedAt
            FROM users u
            LIMIT ? OFFSET ?
        `, [limit, offset]);
    }

    public async registerUser(user: UserRegistration, activationCode: string) {
        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction();

            const [userResult] = await this.pool.query(`
                INSERT INTO users (email, username, password, firstName, lastName)
                VALUES (?, ?, ?, ?, ?)
            `, [user.email, user.username, user.password, user.firstName, user.lastName]);
            const userId = userResult.insertId;

            await connection.query(`
                INSERT INTO codes (code, usedFor, userId, expiresAt)
                VALUES (?, 'activation', ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
                [activationCode, userId],
            );
            await connection.commit();

            return {
                id: userId,
                email: user.email,
                username: user.username,
            };
        } catch (e) {
            console.error(e);
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    }

    public async activateUser(email: string, activationCode: string): Promise<void> {
        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction();
            const codeData = await this.verifyActivationCode(connection, activationCode);
            await this.activateUserAccount(connection, email);
            await this.markActivationCodeAsUsed(connection, codeData.id);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    public async regenerateActivationCode(newCode: string, email?: string, userId?: number): Promise<void> {
        if (!userId && !email) {
            Logger.error(`The ${Logger.em('regenerateActivationCode')} function wasn't supplied with either a user id or an email.`);
            return;
        }

        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction();

            if (!userId) {
                userId = await this.getUserIdByEmail(connection, email!);
            }

            await this.invalidatePreviousCodes(connection, userId);
            await this.createActivationCode(connection, userId, newCode);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    public async extendActivationCodeValidity(email?: string, userId?: number): Promise<void> {
        if (!userId && !email) {
            Logger.error(`The ${Logger.em('extendActivationCodeValidity')} function wasn't supplied with either a user id or an email.`);
            return;
        }

        if (!userId) {
            userId = await this.getUserIdByEmail(await this.pool.getConnection(), email!);
        }

        await this.pool.query(
            `UPDATE codes SET expiresAt = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE userId = ? AND usedFor = 'activation' AND usedAt IS NULL`,
            [userId],
        );
    }

    public async getUserIdByEmail(connection: Connection, email: string): Promise<number> {
        const [rows] = await connection.query(
            `SELECT id FROM users WHERE email = ?`,
            [email]
        );

        if (!rows.length) {
            throw new Error(`User with email ${Logger.em(email)} not found.`);
        }

        return rows[0].id;
    }

    private async verifyActivationCode(connection: Connection, activationCode: string): Promise<{ id: number, expiresAt: string, usedAt: string }> {
        const [codeRows] = await connection.query(
            `SELECT id, expiresAt, usedAt FROM codes WHERE code = ? AND usedFor = 'activation'`,
            [activationCode],
        );

        if (codeRows.length === 0) {
            throw new Error('Invalid activation code.');
        }

        const codeData = codeRows[0];

        if (codeData.usedAt !== null) {
            throw new Error('Activation code already used.');
        }

        if (new Date(codeData.expiresAt) < new Date()) {
            throw new Error('Activation code expired.');
        }

        return codeData;
    }

    private async activateUserAccount(connection: Connection, email: string): Promise<void> {
        const [userResult] = await connection.query(
            `UPDATE users SET verifiedAt = NOW() WHERE email = ?`,
            [email],
        );

        if (userResult.affectedRows === 0) {
            throw new Error('User not found.');
        }
    }

    private async markActivationCodeAsUsed(connection: Connection, codeId: number): Promise<void> {
        await connection.query(
            `UPDATE codes SET usedAt = NOW() WHERE id = ?`,
            [codeId],
        );
    }

    private async invalidatePreviousCodes(connection: Connection, userId: number): Promise<void> {
        await connection.query(
            `UPDATE codes SET expiresAt = NOW() WHERE userId = ? AND usedFor = 'activation' AND usedAt IS NULL`,
            [userId],
        );
    }

    private async createActivationCode(connection: Connection, userId: number, code: string): Promise<void> {
        await connection.query(
            `INSERT INTO codes (code, userId, usedFor, expiresAt) VALUES (?, ?, 'activation', DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
            [code, userId],
        );
    }

    public getRolesForUser(userId: number): Promise<string[]> {
        // const [rows] = await this.pool.query(
        //     `SELECT r.name FROM roles r
        //      JOIN user_roles ur ON r.id = ur.roleId
        //      WHERE ur.userId = ?`,
        //     [userId]
        // );
        //
        // return rows.map((row: { name: string }) => row.name);

                // Temporary default implementation until DB roles are implemented
        return Promise.resolve(['user']);
    }

    public setLastLoggedIn(userId: number) {
        this.pool.query(`
            UPDATE users
            SET lastLogin = NOW()
            WHERE id = ?
        `, [userId])
    }
}