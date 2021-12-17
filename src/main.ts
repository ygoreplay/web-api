import { NestFactory } from "@nestjs/core";
import { graphqlUploadExpress } from "graphql-upload";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use("/graphql", graphqlUploadExpress());
    await app.listen(3001);
}

bootstrap();
