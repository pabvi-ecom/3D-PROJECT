import { redirect } from "next/navigation";
import { brand } from "@/config/brand";

// Mientras solo haya una zona, la home lleva directo a ella.
// Cuando haya varias, aquí irá el "hub" o la lógica de redirección por campaña.
export default function Home() {
  redirect(`/${brand.defaultZone}`);
}
