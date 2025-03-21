import {Injectable} from "~/decorators/injectableDecorator.ts";

@Injectable()
export class HomeService {
    public getPosts() {
        // Dummy implementation – replace with DB logic
        return [{ id: 1, title: "Hello from Deno!" }];
    }

    public createPost(data: unknown) {
        // Dummy implementation – replace with DB logic
        return { id: 2, ...data as object };
    }
}