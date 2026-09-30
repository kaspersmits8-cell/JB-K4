import Link from "next/link";
import { copy } from "../ui/copy.ts";
export default function NotFound() { return <main className="shell stack"><h1>{copy.notFound}</h1><Link href="/cases">{copy.back}</Link></main>; }
