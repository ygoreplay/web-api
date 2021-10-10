import { TypeOrmModule } from "@nestjs/typeorm";

// Check typeORM documentation for more information.
const config: Parameters<typeof TypeOrmModule["forRoot"]>[0] = {
    type: "mysql",
    host: process.env.DB_HOST ? process.env.DB_HOST : "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3002,
    username: process.env.DB_USER ? process.env.DB_USER : "root",
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : "password",
    database: "ygoreplay-api",
    autoLoadEntities: true,
    dropSchema: false,
    entities: ["./dist/**/*.model{.ts,.js}"],

    // We are using migrations, synchronize should be set to false.
    synchronize: false,

    // Run migrations automatically,
    // you can disable this if you prefer running migration manually.
    migrationsRun: true,
    logging: false,
    logger: process.env.NODE_ENV !== "production" ? undefined : "file",

    // Allow both start:prod and start:dev to use migrations
    // __dirname is either dist or src folder, meaning either
    // the compiled js in prod or the ts in dev.
    migrations: ["dist/migrations/**/*{.ts,.js}"],
    cli: {
        // Location of migration should be inside src folder
        // to be compiled into dist/ folder.
        migrationsDir: "src/migrations",
    },
};

export = config;
