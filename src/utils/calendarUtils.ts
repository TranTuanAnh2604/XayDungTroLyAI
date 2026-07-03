export function parseExternalId(externalId: string) {
  const idx = (externalId || '').lastIndexOf('_');
  if (idx === -1) return { calendarId: null, eventId: externalId || null };
  return {
    calendarId: externalId.slice(0, idx),
    eventId: externalId.slice(idx + 1),
  };
}