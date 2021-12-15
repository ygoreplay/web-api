import { FileUpload, GraphQLUpload } from "graphql-upload";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class SubmitParticipantsArgsInput {
    @Field(() => GraphQLUpload)
    public deckFile!: Promise<FileUpload>;

    @Field(() => String)
    public name!: string;
}
