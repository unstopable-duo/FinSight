const PENDO_TRACK_URL = "https://data.pendo.io/data/track";
const PENDO_INTEGRATION_KEY = "0e45be05-cab9-4d42-918b-7864bb6d6e99";

export async function pendoTrack(
  event: string,
  visitorId: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    await fetch(PENDO_TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pendo-integration-key": PENDO_INTEGRATION_KEY,
      },
      body: JSON.stringify({
        type: "track",
        event,
        visitorId,
        accountId: visitorId,
        timestamp: Date.now(),
        properties,
      }),
    });
  } catch (err) {
    console.error(`Pendo track error for "${event}":`, err);
  }
}
