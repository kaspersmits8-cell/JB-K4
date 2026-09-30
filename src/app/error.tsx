"use client";
import { copy } from "../ui/copy.ts";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="shell stack"><h1>{copy.error}</h1><p>{copy.requestFailed}</p><button onClick={reset}>{copy.retry}</button></main>; }
