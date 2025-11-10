import {Logger} from "~/core/classes/logger.class.ts";
import {DIContainer} from "~/core/dependencyInjection/diContainer.ts";
import {DefaultPolicyEngine} from "~/core/classes/policy-engine.default.class.ts";
import {DEFAULT_POLICY_ENGINE_TOKEN} from "~/core/constants/authentication.constant.ts";
import {DefaultPolicyRegistry} from "~/core/constants/policy-registry.default.constant.ts";

export function initCore() {
    // Set log level
    Logger.level = Logger.convertLogLevelToEnum(Deno.env.get("LOG_LEVEL"));
    DIContainer.instance.register(
        DEFAULT_POLICY_ENGINE_TOKEN,
        new DefaultPolicyEngine(DefaultPolicyRegistry)
    );
}