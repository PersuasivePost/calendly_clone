import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid as pgUuid,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { DAYS_OF_WEEK_IN_ORDER_IN_ORDER } from "../constants/index";
import { Many, relations } from "drizzle-orm";

const createdAt = timestamp("createdAt").notNull().defaultNow(); // timestamp for when the record was created
const updatedAt = timestamp("updatedAt")
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date()); // automatically updates the timestamp when the record is modified

export const eventTable = pgTable(
  "events", // table name in the database
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(), // event name

    description: text("description"), // event description

    durationInMinutes: integer("durationInMinutes").notNull(), // event duration in minutes

    clerkUserId: text("clerkUserId").notNull(), // Clerk user ID

    isActive: boolean("isActive").notNull().default(true), // event status

    createdAt,

    updatedAt,
  },

  (table) => [index("clerkUserIdIndex").on(table.clerkUserId)]
);

export const scheduleTable = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  timezone: text("timezone").notNull(),
  clerkUserId: text("clerkUserId").notNull().unique(),
  createdAt,
  updatedAt,
});

// relation
export const scheduleRelations = relations(scheduleTable, ({ many }) => ({
  availabilities: many(scheduleAvailabilityTable), // one to many relationship
}));

// enum
export const scheduleDayOfWeekEnum = pgEnum(
  "day",
  DAYS_OF_WEEK_IN_ORDER_IN_ORDER
);

export const scheduleAvailabilityTable = pgTable(
  "scheduleAvailabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("scheduleId")
      .notNull()
      .references(() => scheduleTable.id, { onDelete: "cascade" }), // cascade delete when schedule is deleted
    startTime: text("startTime").notNull(),
    endTime: text("endTime").notNull(),
    dayOfWeek: scheduleDayOfWeekEnum("dayOfWeek").notNull(),
  },
  (table) => [index("scheduledIndex").on(table.scheduleId)]
);

export const scheduleAvailabilitiesRelations = relations(
  scheduleAvailabilityTable,
  ({ one }) => ({
    schedule: one(scheduleTable, {
      fields: [scheduleAvailabilityTable.scheduleId],
      references: [scheduleTable.id],
    }),
  })
);
