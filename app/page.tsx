import LandingPage from "@/components/LandingPage";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await currentUser();

  // if no user is signed in, show the landing page
  if (!user) return <LandingPage />;

  // if user logged in redirect to events page
  return redirect("/events");
}
