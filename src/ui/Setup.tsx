import { copy } from "./copy.ts";
export function Setup() { return <section className="notice stack"><h2>{copy.setup}</h2><p>{copy.emptyData}</p><code>{copy.dataCheck}</code><code>{copy.dataIngest}</code><code>{copy.createUser}</code></section>; }
