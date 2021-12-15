import * as _ from "lodash";
import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";
import { YGOProCard } from "@card/models/Card.sqlite";
import { BanListDeclaration } from "@card/models/banlist-declaration.object";

export function isCardUpdated(currentCard: Card, newCard: YGOProCard) {
    return !(
        currentCard.ot === newCard.ot &&
        currentCard.alias === newCard.alias &&
        currentCard._setcode === newCard._setcode &&
        currentCard.type === newCard.type &&
        currentCard.atk === newCard.atk &&
        currentCard.def === newCard.def &&
        currentCard.level === newCard.level &&
        currentCard.race === newCard.race &&
        currentCard.attribute === newCard.attribute &&
        currentCard.category === newCard.category
    );
}

export function isTextUpdated(currentText: Text, newText: Text) {
    return !(
        currentText.name === newText.name &&
        currentText.desc === newText.desc &&
        currentText.str1 === newText.str1 &&
        currentText.str2 === newText.str2 &&
        currentText.str3 === newText.str3 &&
        currentText.str4 === newText.str4 &&
        currentText.str5 === newText.str5 &&
        currentText.str6 === newText.str6 &&
        currentText.str7 === newText.str7 &&
        currentText.str8 === newText.str8 &&
        currentText.str9 === newText.str9 &&
        currentText.str10 === newText.str10 &&
        currentText.str11 === newText.str11 &&
        currentText.str12 === newText.str12 &&
        currentText.str13 === newText.str13 &&
        currentText.str14 === newText.str14 &&
        currentText.str15 === newText.str15 &&
        currentText.str16 === newText.str16
    );
}

export function replaceCard(currentCard: Card, newCard: YGOProCard) {
    currentCard.ot = newCard.ot;
    currentCard.alias = newCard.alias;
    currentCard._setcode = newCard._setcode;
    currentCard.type = newCard.type;
    currentCard.atk = newCard.atk;
    currentCard.def = newCard.def;
    currentCard.level = newCard.level;
    currentCard.race = newCard.race;
    currentCard.attribute = newCard.attribute;
    currentCard.category = newCard.category;

    return currentCard;
}

export function replaceText(currentText: Text, newText: Text) {
    currentText.name = newText.name;
    currentText.desc = newText.desc;
    currentText.str1 = newText.str1;
    currentText.str2 = newText.str2;
    currentText.str3 = newText.str3;
    currentText.str4 = newText.str4;
    currentText.str5 = newText.str5;
    currentText.str6 = newText.str6;
    currentText.str7 = newText.str7;
    currentText.str8 = newText.str8;
    currentText.str9 = newText.str9;
    currentText.str10 = newText.str10;
    currentText.str11 = newText.str11;
    currentText.str12 = newText.str12;
    currentText.str13 = newText.str13;
    currentText.str14 = newText.str14;
    currentText.str15 = newText.str15;
    currentText.str16 = newText.str16;

    return currentText;
}

export function replaceEntity(current: Text | Card, _new: any) {
    if (current instanceof Text && _new instanceof Text) {
        return replaceText(current, _new);
    } else if (current instanceof Card && _new instanceof YGOProCard) {
        return replaceCard(current, _new);
    }
}

export function isEntityUpdated(current: Text | Card, _new: Text | YGOProCard) {
    if ("name" in current && "name" in _new) {
        return isTextUpdated(current, _new);
    } else if ("atk" in current && "atk" in _new) {
        return isCardUpdated(current, _new);
    }
}

export function convertBanListDeclarationToMap(banListDeclaration: BanListDeclaration): { [key: number]: number | null } {
    const result: [number, 0 | 1 | 2][] = [];

    banListDeclaration.semiLimit.forEach(id => {
        result.push([id, 2]);
    });

    banListDeclaration.limit.forEach(id => {
        result.push([id, 1]);
    });

    banListDeclaration.forbidden.forEach(id => {
        result.push([id, 0]);
    });

    return _.chain(result)
        .keyBy(p => p[0])
        .mapValues(p => p[1])
        .value();
}
