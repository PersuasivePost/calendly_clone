"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { endOfDay, startOfDay } from "date-fns";
import { google } from "googleapis";

async function getOAutClient(clerkUserId: string) {
  try {
    const client = await clerkClient();

    const { data } = await client.users.getUserOauthAccessToken(
      clerkUserId,
      "google"
    );

    if (data.length === 0 || !data[0].token) {
      throw new Error("No Google OAuth token found for the user.");
    }

    const oAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oAuthClient.setCredentials({ access_token: data[0].token });

    return oAuthClient;
  } catch (error: any) {
    throw new Error(`Failed to get OAuth client: ${error.message}`);
  }
}

// fetch and format calendar events for a user between a given date range
export async function getCalendarEventTimes(
  clerkUserId: string,
  { start, end }: { start: Date; end: Date }
): Promise<{ start: Date; end: Date }[]> {
  try {
    const oAuthClient = await getOAutClient(clerkUserId);

    if (!oAuthClient) {
      throw new Error("OAuth client could not be obtained");
    }

    // fetch events from the google calendar api
    // got code from google api itself:
    const eventsResponse = await google.calendar("v3").events.list({
      calendarId: "primary", // Use the user's primary calendar
      eventTypes: ["default"], // Only fetch regular (non-special) events
      singleEvents: true, // Expand recurring events into single instances
      timeMin: start.toISOString(), // Start of the time range (inclusive)
      timeMax: end.toISOString(), // End of the time range (exclusive)
      maxResults: 2500, // Limit the number of returned events (max allowed by Google)
      auth: oAuthClient, // OAuth2 client for authenticating the API call
    });

    // process and format the events
    return (
      eventsResponse.data.items
        ?.map((event) => {
          // Handle all-day events (no specific time, just a date)
          if (event.start?.date && event.end?.date) {
            return {
              start: startOfDay(new Date(event.start.date)), // Set time to 00:00 of the start date
              end: endOfDay(new Date(event.end.date)), // Set time to 23:59 of the end date
            };
          }

          // Handle timed events with exact start and end date-times
          if (event.start?.dateTime && event.end?.dateTime) {
            return {
              start: new Date(event.start.dateTime), // Convert to JavaScript Date object
              end: new Date(event.end.dateTime), // Convert to JavaScript Date object
            };
          }

          // Ignore events that are missing required time data
          return undefined;
        })
        // Filter out any undefined results and enforce correct typing
        .filter(
          (date): date is { start: Date; end: Date } => date !== undefined
        ) || []
    );
  } catch (error: any) {
    throw new Error(
      `Failed to fetch calendar events: ${error.message || error}`
    );
  }
}
