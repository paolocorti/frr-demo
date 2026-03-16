import { useEffect, useState } from "react";

export interface MediaUrl {
  thumbnail?: string;
  medium?: string;
  large?: string;
  frontend?: string;
  h264_hi?: string;
  original?: string;
}

export interface MediaItem {
  title?: string;
  mimetype?: string;
  url?: MediaUrl;
}

export interface DataItem {
  id: number;
  type?: string;
  preferredLabel?: string;
  detailsTitle?: string;
  year?: string;
  detailsDescription?: string;
  media?: MediaItem[];
}

let cachedItems: DataItem[] | null = null;
let pendingPromise: Promise<DataItem[]> | null = null;
const DATA_PATH = `${import.meta.env.BASE_URL}data.json`;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;
const MAX_EMPTY_RECOVERY_ATTEMPTS = 4;
const EMPTY_RECOVERY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function loadAndSortData(): Promise<DataItem[]> {
  try {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= MAX_RETRIES) {
      try {
        const response = await fetch(DATA_PATH);
        if (!response.ok) {
          throw new Error(
            `Failed to load data.json (${response.status} ${response.statusText})`,
          );
        }

        const raw = await response.json();
        console.log({ raw });

        const items: DataItem[] = Array.isArray(raw) ? raw : [];

        const sorted = [...items].sort((a, b) => {
          const ay = Number.parseInt(a.year ?? "0", 10) || 0;
          const by = Number.parseInt(b.year ?? "0", 10) || 0;

          // Oldest first
          return ay - by;
        });

        if (sorted.length === 0) {
          throw new Error("data.json loaded but contains no items");
        }

        cachedItems = sorted;
        return sorted;
      } catch (error) {
        lastError = error;
        if (attempt === MAX_RETRIES) break;
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
      attempt += 1;
    }

    console.error("Failed to load data.json", lastError);
    return [];
  } finally {
    pendingPromise = null;
  }
}

function fetchDataOnce(): Promise<DataItem[]> {
  if (cachedItems !== null) {
    return Promise.resolve(cachedItems);
  }

  if (!pendingPromise) {
    pendingPromise = loadAndSortData();
  }

  return pendingPromise;
}

export function useDataItems(): DataItem[] {
  const [items, setItems] = useState<DataItem[]>(() => cachedItems ?? []);

  useEffect(() => {
    let isMounted = true;
    let retryTimer: number | null = null;
    let emptyRecoveryAttempts = 0;

    const load = () => {
      fetchDataOnce().then((data) => {
        if (!isMounted) return;

        setItems(data);

        if (
          data.length === 0 &&
          cachedItems === null &&
          emptyRecoveryAttempts < MAX_EMPTY_RECOVERY_ATTEMPTS
        ) {
          emptyRecoveryAttempts += 1;
          retryTimer = window.setTimeout(load, EMPTY_RECOVERY_DELAY_MS);
        }
      });
    };

    if (cachedItems === null) {
      load();
    }

    return () => {
      isMounted = false;
      if (retryTimer != null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, []);

  return items;
}
