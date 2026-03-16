import { type CSSProperties } from "react";
import { useVisibleItemsStore } from "../stores/visibleItemsStore";
import { useDataItems } from "../hooks/useDataItems";

const colorType = {
  Issues: "#8B153D",
  Articles: "#8B153D",
  Publications: "#8B153D",
  Photographies: "#F0EDE7",
  Video: "#F0EDE7",
  Documents: "#F0EDE7",
  Audio: "#F0EDE7",
  Correspondences: "#C9CAD4",
  Drawings: "#C9CAD4",
  People: "#BB0F33",
  Companies: "#BB0F33",
  Events: "#BB0F33",
  Places: "#BB0F33",
  "Archival Units": "#FFF200",
  Files: "#FFF200",
  Objects: "#FFF200",
  "Signature Features": "#ED1C24",
  Models: "#ED1C24",
  Prototypes: "#ED1C24",
  "Sport car": "#ED1C24",
  Engines: "#ED1C24",
  SingleSeater: "#ED1C24",
  Meccanica: "#ED1C24",
};

export function ItemsCardStrip({ isStarted }: { isStarted: boolean }) {
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

  const centerIndex = (visibleItems.length - 1) / 2;
  const maxDistanceFromCenter = Math.max(
    centerIndex,
    visibleItems.length - 1 - centerIndex,
    1,
  );

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
          const distanceFromCenter = Math.abs(index - centerIndex);
          const normalizedDistance = Math.min(
            distanceFromCenter / maxDistanceFromCenter,
            1,
          );
          const emphasis = 1 - normalizedDistance;
          const cardWidth = isStarted ? 95 + emphasis * 90 : 12 + emphasis * 14;
          const cardHeight = isStarted ? 150 : 60;
          const overlapOffset = isStarted ? -18 : -6;
          const zIndex = Math.round(20 + emphasis * 100);

          return (
            <article
              key={item.id}
              style={{
                ...cardStyle,
                ...visibleCardStyle,
                width: cardWidth,
                height: cardHeight,
                backgroundColor: isStarted
                  ? "rgba(10,10,10,0.95)"
                  : `${colorType[item.type as keyof typeof colorType]}`,
                borderLeft: `${isStarted ? 8 : 3}px solid ${colorType[item.type as keyof typeof colorType]}`,
                borderRight: `${isStarted ? 8 : 3}px solid ${colorType[item.type as keyof typeof colorType]}`,
                zIndex,
                marginLeft: index === 0 ? 0 : overlapOffset,
                //transform: `scale(${isStarted ? 0.8 + emphasis * 0.2 : 0.86 + emphasis * 0.14})`,
                //transformOrigin: "bottom center",
              }}
              aria-label={item.detailsTitle ?? item.preferredLabel}
            >
              {thumbUrl && isStarted && (
                <img
                  src={thumbUrl}
                  alt={item.detailsTitle ?? item.preferredLabel ?? ""}
                  style={imageStyle}
                  loading="lazy"
                />
              )}
              {isStarted && (
                <div>
                  <h3 style={{ fontSize: 10 }}>{item.preferredLabel}</h3>
                  <p style={{ fontSize: 10 }}>
                    {item.year && <span>{item.year}</span>}
                  </p>
                </div>
              )}
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
  bottom: 20,
  display: "flex",
  justifyContent: "center",
  padding: "12px 16px 16px",
  boxSizing: "border-box",
  pointerEvents: "auto",
  zIndex: 1000,
  background:
    "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.7), transparent)",
};

const stripInnerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  overflowX: "auto",
  paddingBottom: 4,
  paddingLeft: 8,
  paddingRight: 8,
};

const cardStyle: CSSProperties = {
  maxWidth: 240,
  aspectRatio: 9 / 16,
  padding: "8px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 6px rgba(0,0,0,0.6)",
  color: "#f5f5f5",
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
};

const visibleCardStyle: CSSProperties = {
  opacity: 1,
};

const imageStyle: CSSProperties = {
  height: "100px",
  margin: "0 auto",
  objectFit: "cover",
  display: "block",
};
