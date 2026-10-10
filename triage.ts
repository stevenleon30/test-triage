import { readFileSync } from "node:fs";
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

const THRESHOLD = 0.7; // below this confidence, send to a human
const client = new TypeSafeClient();

type Failure = { test: string; status: string; retries: number; error: string };

function collect(node: any, out: Failure[]) {
  for (const spec of node.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const results = t.results ?? [];
      if ((t.status === "unexpected" || t.status === "flaky") && results.length) {
        const last = results[results.length - 1];
        out.push({
          test: spec.title,
          status: t.status,
          retries: results.length - 1,
          error: (last.error?.message ?? "")
            .replace(/\u001b\[[0-9;]*m/g, "")
            .slice(0, 1500),
        });
      }
    }
  }
  for (const child of node.suites ?? []) collect(child, out);
}

const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
const failures: Failure[] = [];
for (const s of report.suites ?? []) collect(s, failures);

console.log("| Test | Verdict | Confidence |\n|---|---|---|");

for (const f of failures) {
  try {
    const r = await client.systemOne({
      state: f,
      questions: {
        cause: choice("What most likely caused this Playwright test failure?", {
          real_bug: "The app behaves wrongly. The assertion is correct.",
          flaky: "Timing, race condition, or network hiccup.",
          test_issue: "Bad selector, outdated test, or wrong assertion.",
          environment: "CI, config, auth, or infrastructure problem.",
        }),
      },
    });
    const a = r.answers.cause;
    const verdict = a.confidence >= THRESHOLD ? a.choice : "needs_human";
    console.log(`| ${f.test} | ${verdict} | ${a.confidence.toFixed(2)} |`);
  } catch (e) {
    console.error(e);
    console.log(`| ${f.test} | needs_human | 0.00 |`);
  }
}
