"use client";

import { eventFormSchema } from "@/schema/events";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { useTransition } from "react";
import Link from "next/link";
import { createEvent, deleteEvent, updateEvent } from "@/server/actions/events";
import router from "next/router";

export default function EventForm({
  event,
}: {
  event?: {
    id: string;
    name: string;
    description?: string;
    durationInMinutes: number;
    isActive: boolean;
  };
}) {
  const [isDeletePending, startDeleteTransition] = useTransition();

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event
      ? {
          ...event,
        }
      : {
          // if event not provided, use default values
          isActive: true,
          durationInMinutes: 30,
          description: "",
          name: "",
        },
  });

  // handle form submission
  async function onSubmit(values: z.infer<typeof eventFormSchema>) {
    const action =
      event == null ? createEvent : updateEvent.bind(null, event.id);

    try {
      await action(values);
    } catch (error) {
      form.setError("root", {
        message: `There was an error saving your event ${
          error instanceof Error ? error.message : String(error)
        }`, // copilot fixed
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-6 flex-col"
      >
        {/* show root error if any */}
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
        {/* // form field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                The name users will see when booking
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        {/* duration field */}
        <FormField
          control={form.control}
          name="durationInMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>In Minutes</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        {/* optional description FormField */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea className="resize-none h-32" {...field} />
              </FormControl>
              <FormDescription>
                Optional description of the event
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* active status FormField */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </div>
              <FormDescription>
                Inactive events will not be visible for users to book
              </FormDescription>
            </FormItem>
          )}
        />
        {/* Buttons section */}
        <div className="flex gap-2 justify-end">
          {/* Delete Button (only shows if editing existing event) */}
          {event && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="cursor-pointer hover:scale-105 hover:bg-red-700"
                  variant="destructive"
                  disabled={isDeletePending || form.formState.isSubmitting}
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this event.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-700 cursor-pointer"
                    disabled={isDeletePending || form.formState.isSubmitting}
                    onClick={() => {
                      // Start a React transition to keep the UI responsive during this async operation
                      startDeleteTransition(async () => {
                        try {
                          // Attempt to delete the event by its ID
                          await deleteEvent(event.id);
                          router.push("/events");
                        } catch (error: any) {
                          // If something goes wrong, show an error at the root level of the form
                          form.setError("root", {
                            message: `There was an error deleting your event: ${error.message}`,
                          });
                        }
                      });
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Cancel Button - redirects to events list */}
          <Button
            disabled={isDeletePending || form.formState.isSubmitting}
            type="button"
            asChild
            variant="outline"
          >
            <Link href="/events">Cancel</Link>
          </Button>

          {/* Save Button - submits the form */}
          <Button
            className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
            disabled={isDeletePending || form.formState.isSubmitting}
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
