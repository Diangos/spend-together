export interface UserBase {
    id?: number;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    createdAt?: string;
    lastLogin?: string;
}

export interface UserRegistration extends Omit<UserBase, 'id' | 'createdAt' | 'lastLogin'> {
    password: string;
}

export interface DBUser extends Required<Omit<UserBase, 'modifiedAt' | 'lastLogin'>> {
    password: string;
    lastLogin?: string | null;
    modifiedAt?: string | null;
}

export interface PublicUser extends Omit<UserBase, 'modifiedAt' | 'password'> {
    id: number;
    createdAt: string;
}