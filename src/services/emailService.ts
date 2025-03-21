import {Injectable} from "~/decorators/injectableDecorator.ts";
import {EmailType} from "~/enums/emailTypesEnum.ts";

@Injectable()
export class EmailService {
    public sendEmail(type: EmailType, data: unknown) {
        switch (type) {
            case EmailType.REGISTRATION:
                this.sendRegistrationEmail(data);
                break;
            case EmailType.PASSWORD_RESET:
                // this.sendPasswordResetEmail(data);
                break;
            case EmailType.ACTIVATION:
                // this.sendActivationEmail(data);
        }
    }

    private sendRegistrationEmail(data: unknown) {
        // TODO: Implement email sending
    }
}