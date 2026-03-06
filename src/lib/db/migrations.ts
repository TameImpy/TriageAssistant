import { nanoid } from "nanoid";
import { getDb } from "./client";
import {
  CREATE_REQUESTS_TABLE,
  CREATE_MESSAGES_TABLE,
  CREATE_AGENT_CONFIGS_TABLE,
  CREATE_APPROVED_TOOLS_TABLE,
  CREATE_CATALOGUE_REQUESTS_TABLE,
  ADD_REQUIRES_SYSTEM_ACCESS_COLUMN,
} from "./schema";

let migrated = false;

export function runMigrations(): void {
  if (migrated) return;
  const db = getDb();
  db.exec(CREATE_REQUESTS_TABLE);
  db.exec(CREATE_MESSAGES_TABLE);
  db.exec(CREATE_AGENT_CONFIGS_TABLE);
  db.exec(CREATE_APPROVED_TOOLS_TABLE);
  db.exec(CREATE_CATALOGUE_REQUESTS_TABLE);

  try {
    db.exec(ADD_REQUIRES_SYSTEM_ACCESS_COLUMN);
  } catch {
    // column already exists
  }

  // Seed approved tools if none exist
  const count = (
    db.prepare("SELECT COUNT(*) as c FROM approved_tools").get() as { c: number }
  ).c;

  if (count === 0) {
    const now = Date.now();
    const seeds = [
      {
        name: "Grammarly Business",
        description:
          "AI-powered writing assistant for grammar, clarity, and tone improvements. Works in browser and desktop apps.",
        category: "Writing & Editing",
        vendor_url: "https://www.grammarly.com/business",
        training_url: "https://support.grammarly.com/hc/en-us",
        training_notes:
          "Complete the onboarding checklist in your Grammarly dashboard. Enable the browser extension for best results.",
      },
      {
        name: "GitHub Copilot",
        description:
          "AI pair programmer that suggests code completions and generates boilerplate directly in your editor.",
        category: "Developer Tools",
        vendor_url: "https://github.com/features/copilot",
        training_url: "https://docs.github.com/en/copilot/getting-started-with-github-copilot",
        training_notes:
          "Read the acceptable use policy before starting. Do not submit proprietary algorithms or credentials as prompts.",
      },
      {
        name: "Microsoft 365 Copilot",
        description:
          "AI assistant integrated into Word, Excel, PowerPoint, Teams, and Outlook for productivity and summarisation.",
        category: "Productivity",
        vendor_url: "https://www.microsoft.com/en-us/microsoft-365/copilot",
        training_url: "https://adoption.microsoft.com/en-us/copilot/",
        training_notes:
          "Complete the Microsoft Copilot Foundations learning path. Review the data handling guidelines for your region.",
      },
    ];

    for (const seed of seeds) {
      db.prepare(
        `INSERT INTO approved_tools (id, name, description, category, vendor_url, training_url, training_notes, added_by, added_at, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(
        nanoid(),
        seed.name,
        seed.description,
        seed.category,
        seed.vendor_url,
        seed.training_url,
        seed.training_notes,
        "system",
        now
      );
    }
  }

  migrated = true;
}
