import { redirect } from "next/navigation";

export default function Home() {
  redirect("/shop");
  return <>Coming Soon</>;
}
