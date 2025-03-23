import {Context} from "jsr:@oak/oak";
import {Controller, Get, Post} from "~/core/index.ts";
import UserModel from "~/models/usersModel.ts";
import {userActivationSchema, userRegistrationSchema} from "~/schemas/userSchema.ts";
import {GeneralService} from "~/services/generalService.ts";
import {UserService} from "~/services/userService.ts";

@Controller("/users")
export class UsersController {
    constructor(
        public userModel: UserModel,
        public userService: UserService,
        public generalService: GeneralService,
    ) {
    }

    @Get("", {
        summary: "Get all users",
        description: "Retrieves a list of all users",
        tags: ["Users"],
        responses: {
            "200": {
                description: "A list of users",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "number" },
                                    email: { type: "string" },
                                    username: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        },
    })
    public async getUsers(ctx: Context) {
        const users = await this.userModel.getUsers();
        ctx.response.body = users[0];
    }

    /**
     * Register a new user
     * @param ctx
     */
    @Post("register-user", {
        summary: "Register a new user",
        description: "Registers a user and sends an activation email.",
        tags: ["Users", "Registration"],
        requestBody: {
            required: true,
            description: "User registration data",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        required: ["email", "password", "username"],
                        properties: {
                            email: { type: "string", format: "email" },
                            password: { type: "string" },
                            username: { type: "string" },
                        },
                    },
                    examples: {
                        example1: {
                            value: {
                                email: "user@example.com",
                                password: "strongPassword123",
                                username: "newuser",
                            },
                        },
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "User successfully created",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                id: { type: "number" },
                                email: { type: "string" },
                            },
                        },
                    },
                },
            },
            "400": {
                description: "Invalid input data",
            },
        },
    })
    public async registerUser(ctx: Context) {
        const {success, parseResult} = await this.generalService.getAndValidateBody(ctx, userRegistrationSchema);
        const data = parseResult.data;

        if (!success) {
            ctx.response.status = 401;
            ctx.response.body = {
                error: 'Bad request',
                message: parseResult.error.format(),
            };
            return;
        }

        try {
            const activationCode = this.userService.generateSecureActivationCode();
            const user = await this.userModel.registerUser({
                ...data!,
                password: await this.userService.hashPassword(data!.password)
            }, activationCode);

            ctx.response.status = 201;
            ctx.response.body = {
                message: "User registered successfully.",
                user,
            };
        } catch (e: unknown) {
            if (this.generalService.isErrorADuplicateError(e)) {
                ctx.response.status = 400;
                ctx.response.body = {
                    error: 'Registration failure',
                    message: 'Email or username already in use'
                };
            } else {
                ctx.response.status = 500;
                ctx.response.body = {
                    error: 'Internal server error',
                    message: 'Something went wrong, please try again later.'
                };
            }

            return;
        }

        // TODO: Send activation email
    }

    @Post("activate-account", {
        summary: "Activate a user account",
        description: "Activates a user account using an activation code sent by email.",
        tags: ["Users", "Activation"],
        requestBody: {
            required: true,
            description: "User activation data",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        required: ["email", "code"],
                        properties: {
                            email: { type: "string", format: "email" },
                            code: { type: "string" },
                        },
                    },
                    examples: {
                        example1: {
                            value: {
                                email: "bibi@gigi.com",
                                code: "123456",
                            },
                        },
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Account activated successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            "400": {
                description: "Invalid input data",
            },
        },
    })
    public async activateAccount(ctx: Context) {
        const {success, parseResult} = await this.generalService.getAndValidateBody(ctx, userActivationSchema);
        const data = parseResult.data;

        if (!success) {
            return;
        }

        await this.userModel.activateUser(data.email, data.code);

        ctx.response.status = 200;
        ctx.response.body = {
            message: 'Account activated successfully'
        };
    }
}
