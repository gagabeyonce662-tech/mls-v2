import { redirect } from "next/navigation";

export default function PreConstructionRedirectPage() {
  redirect("/precon-listings");
}
