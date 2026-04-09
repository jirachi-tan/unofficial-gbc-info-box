import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const NOTION_API_BASE_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";
const OUTPUT_FILE_PATH = fileURLToPath(new URL("../public/data/events.json", import.meta.url));
const OUTPUT_DIR_PATH = dirname(OUTPUT_FILE_PATH);
const PROPERTY_NAMES = ["名前", "カテゴリ", "メモ", "公式リンク", "場所", "開催期間", "最終更新日時"];
const MAX_RETRIES = 3;

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function joinPlainText(items) {
  return items.map((item) => item.plain_text ?? "").join("").trim();
}

function formatIsoDateToJa(input) {
  if (!input) return "";

  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    return `${Number(dateOnlyMatch[1])}年${Number(dateOnlyMatch[2])}月${Number(dateOnlyMatch[3])}日`;
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "1";
  const day = parts.find((part) => part.type === "day")?.value ?? "1";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${year}年${Number(month)}月${Number(day)}日 ${hour}:${minute}`;
}

function formatNotionDate(dateValue) {
  if (!dateValue?.start) return "";

  const start = formatIsoDateToJa(dateValue.start);
  if (!dateValue.end) return start;

  return `${start} → ${formatIsoDateToJa(dateValue.end)}`;
}

function formulaToText(formula) {
  if (!formula) return "";

  switch (formula.type) {
    case "string":
      return formula.string ?? "";
    case "number":
      return formula.number == null ? "" : String(formula.number);
    case "boolean":
      return formula.boolean ? "true" : "false";
    case "date":
      return formatNotionDate(formula.date);
    default:
      return "";
  }
}

function propertyToText(property) {
  if (!property) return "";

  switch (property.type) {
    case "title":
      return joinPlainText(property.title);
    case "rich_text":
      return joinPlainText(property.rich_text);
    case "url":
      return property.url ?? "";
    case "number":
      return property.number == null ? "" : String(property.number);
    case "select":
      return property.select?.name ?? "";
    case "multi_select":
      return property.multi_select.map((item) => item.name).join(", ");
    case "status":
      return property.status?.name ?? "";
    case "date":
      return formatNotionDate(property.date);
    case "email":
      return property.email ?? "";
    case "phone_number":
      return property.phone_number ?? "";
    case "formula":
      return formulaToText(property.formula);
    case "created_time":
      return formatIsoDateToJa(property.created_time);
    case "last_edited_time":
      return formatIsoDateToJa(property.last_edited_time);
    default:
      return "";
  }
}

function extractSortablePeriodKey(periodText) {
  const match = periodText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s+(\d{1,2}:\d{2}))?/);
  if (!match) return "9999-99-99 99:99";

  const year = match[1];
  const month = match[2].padStart(2, "0");
  const day = match[3].padStart(2, "0");
  const time = match[4] ?? "99:99";
  return `${year}-${month}-${day} ${time}`;
}

function compareRows(a, b) {
  const periodCompare = extractSortablePeriodKey(a["開催期間"] ?? "").localeCompare(extractSortablePeriodKey(b["開催期間"] ?? ""));
  if (periodCompare !== 0) return periodCompare;

  const titleCompare = (a["名前"] ?? "").localeCompare(b["名前"] ?? "");
  if (titleCompare !== 0) return titleCompare;

  return (a.id ?? "").localeCompare(b.id ?? "");
}

function mapPageToRow(page) {
  const properties = page.properties ?? {};

  return {
    id: page.id,
    名前: propertyToText(properties["名前"]),
    カテゴリ: propertyToText(properties["カテゴリ"]),
    メモ: propertyToText(properties["メモ"]),
    公式リンク: propertyToText(properties["公式リンク"]),
    場所: propertyToText(properties["場所"]),
    開催期間: propertyToText(properties["開催期間"]),
    最終更新日時: propertyToText(properties["最終更新日時"]) || formatIsoDateToJa(page.last_edited_time),
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function requestJsonWithRetry(url, options) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return await response.json();
      }

      const bodyText = await response.text();
      const isRetryable = response.status === 429 || response.status === 503;
      if (!isRetryable || attempt === MAX_RETRIES) {
        throw new Error(`Notion API request failed (${response.status}): ${bodyText}`);
      }

      lastError = new Error(`Notion API request failed (${response.status}): ${bodyText}`);
      console.warn(`Notion API returned ${response.status}. Retrying (${attempt}/${MAX_RETRIES})...`);
    } catch (error) {
      lastError = error;
      const isApiError = error instanceof Error && error.message.startsWith("Notion API request failed");
      if (isApiError || attempt === MAX_RETRIES) {
        break;
      }
      console.warn(`Notion API request errored. Retrying (${attempt}/${MAX_RETRIES})...`);
    }

    await wait(attempt * 1000);
  }

  throw lastError;
}

async function queryDataSource({ token, dataSourceId, startCursor }) {
  const url = new URL(`${NOTION_API_BASE_URL}/data_sources/${dataSourceId}/query`);
  for (const propertyName of PROPERTY_NAMES) {
    url.searchParams.append("filter_properties[]", propertyName);
  }

  return requestJsonWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      page_size: 100,
      result_type: "page",
      ...(startCursor ? { start_cursor: startCursor } : {}),
    }),
  });
}

async function fetchAllPages({ token, dataSourceId }) {
  const pages = [];
  let nextCursor = undefined;

  do {
    const response = await queryDataSource({ token, dataSourceId, startCursor: nextCursor });
    pages.push(...response.results.filter((result) => result.object === "page"));
    nextCursor = response.has_more ? response.next_cursor : undefined;
  } while (nextCursor);

  return pages;
}

async function main() {
  const token = getRequiredEnv("NOTION_TOKEN");
  const dataSourceId = getRequiredEnv("NOTION_DATA_SOURCE_ID");

  const pages = await fetchAllPages({ token, dataSourceId });
  const rows = pages
    .map(mapPageToRow)
    .filter((row) => row["名前"] && row["開催期間"])
    .sort(compareRows);

  await mkdir(OUTPUT_DIR_PATH, { recursive: true });
  await writeFile(OUTPUT_FILE_PATH, `${JSON.stringify(rows, null, 2)}\n`, "utf8");

  console.log(`Synced ${rows.length} rows to ${OUTPUT_FILE_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});