import { type CSSProperties } from "react";
import { useVisibleItemsStore } from "../stores/visibleItemsStore";
import { useDataItems } from "../hooks/useDataItems";

export function ItemsCardStrip() {
  const items = useDataItems();
  const visibleIds = useVisibleItemsStore((s) => s.visibleIds);

  if (!items.length) {
    return null;
  }

  const visibleSet = new Set(visibleIds);
  const visibleItems = items.filter((item) => visibleSet.has(item.id));

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section
      style={stripContainerStyle}
      aria-label="Items overview cards"
      aria-live="polite"
    >
      <div style={stripInnerStyle}>
        {visibleItems.map((item, index) => {
          const media = item.media?.[0];
          const thumbUrl =
            media?.url?.thumbnail ??
            media?.url?.medium ??
            media?.url?.frontend ??
            media?.url?.large ??
            media?.url?.original;

          return (
            <article
              key={item.id}
              style={{
                ...cardStyle,
                ...visibleCardStyle,
                transform: `rotate3d(0,0,0,${-60 + index * 10}deg)`,
                transformOrigin: "center center",
                width: window.innerWidth / 17,
              }}
              aria-label={item.detailsTitle ?? item.preferredLabel}
            >
              {thumbUrl && (
                <img
                  src={thumbUrl}
                  alt={item.detailsTitle ?? item.preferredLabel ?? ""}
                  style={imageStyle}
                  loading="lazy"
                />
              )}
              {/* <div style={cardBodyStyle}>
                <h3 style={titleStyle}>{item.preferredLabel}</h3>
                <p style={metaStyle}>{item.year && <span>{item.year}</span>}</p>
              </div> */}
            </article>
          );
        })}
      </div>
    </section>
  );
}

const stripContainerStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "12px 16px 16px",
  boxSizing: "border-box",
  pointerEvents: "auto",
  zIndex: 1000,
  background:
    "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.7), transparent)",
};

const stripInnerStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  overflowX: "auto",
  paddingBottom: 4,
};

const cardStyle: CSSProperties = {
  minWidth: 100,
  maxWidth: 120,
  backgroundColor: "rgba(10,10,10,0.95)",
  aspectRatio: 9 / 16,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
  color: "#f5f5f5",
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
};

const visibleCardStyle: CSSProperties = {
  opacity: 1,
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: 120,
  objectFit: "cover",
  display: "block",
};
