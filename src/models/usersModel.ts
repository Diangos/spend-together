import {Injectable} from "~/core/index.ts";
import {DB} from "~/db/db.ts";
import {UserRegistration} from "~/interfaces/user.interface.ts";

@Injectable()
export default class UserModel {
    private pool;

    constructor() {
        // deno-lint-ignore no-explicit-any
        this.pool = DB.instance.pool as any;
    }

    public getUserById(id: unknown) {
        // This method should fetch and return a user by ID
        return { id: id, name: 'Alice' };
    }

    public getUsers() {
        // This method should fetch and return multiple users
        return this.pool.query('SELECT id, email, username, lastName, firstName, lastLogin, createdAt FROM users')
    }

    public async registerUser(user: UserRegistration, activationCode: string) {
        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction();

            const [userResult] = await this.pool.query(
                `INSERT INTO users (email, username, password, firstName, lastName)
                VALUES (?, ?, ?, ?, ?)`,
                [user.email, user.username, user.password, user.firstName, user.lastName],
            );
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

    public activateUser(userEmail: string, activationCode: string) {
        return this.pool.query(`
            `
        )
    }
}