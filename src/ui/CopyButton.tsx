"use client";
import { useState } from "react";
import { copy } from "./copy.ts";
export function CopyButton({ text }: { text: string }) {
  const [message,setMessage] = useState("");
  return <span className="row wrap"><button onClick={async () => { try { await navigator.clipboard.writeText(text); setMessage(copy.copied); } catch { setMessage(copy.copyFailed); } }}>{copy.copy}</button><span role="status">{message}</span></span>;
}
