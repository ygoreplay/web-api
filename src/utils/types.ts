export interface RawDeck {
    main: number[];
    extra: number[];
    side: number[];
}

export interface ParticipantDeck {
    name: string;
    deck: RawDeck;
}
