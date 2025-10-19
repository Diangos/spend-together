import {Context} from "jsr:@oak/oak";
import {Logger} from "~/core/classes/logger.class.ts";
import {Controller, Get, Post} from "~/core/index.ts";
import {EmailType} from "~/enums/emailTypes.enum.ts";
import UserModel from "~/models/users.model.ts";
import {userActivationCodeRegenerationSchema, userActivationSchema, userRegistrationSchema} from "~/schemas/user.schema.ts";
import {EmailService} from "~/services/email.service.ts";
import {GeneralService} from "~/services/general.service.ts";
import {UserService} from "~/services/user.service.ts";

@Controller("users")
export class UsersController {
    constructor(
        public userModel: UserModel,
        public userService: UserService,
        public generalService: GeneralService,
        public emailService: EmailService,
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

            this.emailService.sendEmail(EmailType.REGISTRATION, user);
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
                Logger.error('User creation failed:', e);
            }

            return;
        }
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

        try {
            await this.userModel.activateUser(data.email, data.code);
        } catch (e) {
            Logger.error(`Activating user with email ${Logger.em(data.email)} failed.`, e);
            ctx.response.status = 400;
            ctx.response.body = {message: 'Invalid email or code or the user is already activated.'};
            return;
        }

        ctx.response.status = 200;
        ctx.response.body = {message: 'Account activated successfully'};
    }

    @Post("regenerate-code", {
        summary: "Regenerates the code to activate the user",
        description: "Regenerates the code to activate the user and sends the user another email if possible.",
        tags: ["Users", "Activation", "Code"],
        requestBody: {
            required: true,
            description: "JSON with email",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        required: ["email"],
                        properties: {
                            email: { type: "string", format: "email" },
                        },
                    },
                    examples: {
                        example1: {
                            value: {
                                email: "bibi@gigi.com",
                            },
                        },
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Code regenerated successfully",
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
            "401": {
                description: "Inexistent or no email provided or the user is already activated",
            },
        },
    })
    @Post("resend-code", {
        summary: "Resends the code to the user",
        description: "Regenerates the code to the user's specified email address, extending its validity to 24h.",
        tags: ["Users", "Activation", "Code"],
        requestBody: {
            required: true,
            description: "JSON with email",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        required: ["email"],
                        properties: {
                            email: { type: "string", format: "email" },
                        },
                    },
                    examples: {
                        example1: {
                            value: {
                                email: "bibi@gigi.com",
                            },
                        },
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Code regenerated successfully",
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
                description: "Inexistent or no email provided or the user is already activated",
            },
        },
    })
    public async regenerateCode(ctx: Context) {
        const {success, parseResult} = await this.generalService.getAndValidateBody(ctx, userActivationCodeRegenerationSchema);
        const data = parseResult.data;

        if (!success) {
            return;
        }

        try {
            if (ctx.request.url.pathname.endsWith("regenerate-code")) {
                const activationCode = this.userService.generateSecureActivationCode();
                await this.userModel.regenerateActivationCode(activationCode, data.email);
                this.emailService.sendEmail(EmailType.ACTIVATION, {email: data.email, code: activationCode});
            } else {
                await this.userModel.extendActivationCodeValidity(data.email);
            }
        } catch (e) {
            Logger.error('Error when trying to handle activation code:', e);
            ctx.response.status = 400;
            ctx.response.body = {
                message: 'Invalid email or the user is already activated'
            };
            return;
        }

        ctx.response.status = 200;
        ctx.response.body = {
            message: 'Activation code sent successfully'
        };
    }
}
