import { BaseEntity, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";

import Player from "src/replay/models/player.model";
import Deck from "src/replay/models/deck.model";
import Round from "src/replay/models/round.model";

@Entity({
    name: "player-decks",
})
export default class PlayerDeck extends BaseEntity {
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (Many-to-One) - Player => PlayerDeck
    //
    @ManyToOne(() => Player, player => player.playerDecks)
    public player!: Player;

    @RelationId((entity: PlayerDeck) => entity.player)
    public playerId!: Player["id"];

    //
    // Relation (Many-to-One) - Deck => PlayerDeck
    //
    @ManyToOne(() => Deck, deck => deck.playerDecks)
    public deck!: Deck;

    @RelationId((entity: PlayerDeck) => entity.deck)
    public deckId!: Deck["id"];

    //
    // Relation (Many-to-One) - Match => PlayerDeck
    //
    @ManyToOne(() => Round, match => match.playerDecks)
    public match!: Round;

    @RelationId((entity: PlayerDeck) => entity.match)
    public matchId!: Round["id"];
}
