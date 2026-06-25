/**
 * usernames.ts — The fake viewer dataset (300 names + persistent colors),
 * mirrored from the web overlay so both stay visually identical.
 */

import dataset from "./usernames.json";

export type FakeUser = { name: string; color: string };

export const USERS: FakeUser[] = (dataset as { users: FakeUser[] }).users;
