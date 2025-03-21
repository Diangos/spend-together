import {hash} from "jsr:@felix/argon2";
import {Injectable} from "~/decorators/injectableDecorator.ts";

@Injectable()
export class UserService {
    // This method should hash the password with Argon2
    public hashPassword(password: string): Promise<string> {
        return hash(password);
    }

    public generateSecureActivationCode(length: number = 6): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from(crypto.getRandomValues(new Uint8Array(length)))
            .map(x => chars[x % chars.length])
            .join('');
    }
}