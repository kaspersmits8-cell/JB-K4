import Image from "next/image";
import { copy } from "./copy.ts";

export function Logo() {
  return <Image className="brand-logo" src="/trustworx.svg" alt={copy.app} width={4008} height={559} unoptimized loading="eager" />;
}
