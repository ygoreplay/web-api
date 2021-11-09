import * as moment from "moment";
import { Between, LessThan, MoreThan, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

const formatDate = (date: Date) => moment(date).format("YYYY-MM-DD HH:mm:ss");

export const FutureThan = (date: Date) => MoreThan(formatDate(date));
export const PastThan = (date: Date) => LessThan(formatDate(date));
export const PastOrEqualWith = (date: Date) => LessThanOrEqual(formatDate(date));
export const FutureOrEqualWith = (date: Date) => MoreThanOrEqual(formatDate(date));
export const BetweenDate = (startDate: Date, endDate: Date) => Between(formatDate(startDate), formatDate(endDate));
