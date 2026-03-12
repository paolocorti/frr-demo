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

async function loadAndSortData(): Promise<DataItem[]> {
  try {
    const response = await fetch("/data.json");
    const raw = await response.json();

    const items: DataItem[] = Array.isArray(raw) ? raw : [];

    const sorted = [...items].sort((a, b) => {
      const ay = Number.parseInt(a.year ?? "0", 10) || 0;
      const by = Number.parseInt(b.year ?? "0", 10) || 0;

      // Oldest first
      return ay - by;
    });

    cachedItems = sorted;
    return sorted;
  } catch (error) {
    console.error("Failed to load data.json", error);
    cachedItems = [];
    return [];
  } finally {
    pendingPromise = null;
  }
}

function fetchDataOnce(): Promise<DataItem[]> {
  if (cachedItems) {
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

    if (!cachedItems) {
      fetchDataOnce().then((data) => {
        if (isMounted) {
          setItems(data);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return items;
}
