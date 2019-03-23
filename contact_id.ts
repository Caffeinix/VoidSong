export type ContactId = number;

let nextContactId: ContactId = 1;

export function getNextContactId(): ContactId {
  return nextContactId++;
}
