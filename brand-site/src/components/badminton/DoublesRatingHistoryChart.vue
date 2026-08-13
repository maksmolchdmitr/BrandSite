<template>
  <div class="chartRoot" @mouseleave="clearHover">
    <div v-if="!hasPoints" class="empty">{{ emptyText }}</div>
    <template v-else>
      <div class="chartBody">
        <div class="yAxis">
          <span
            v-for="(tick, index) in yTicks"
            :key="'y-' + index"
            class="yLabel"
            :style="{ top: tick.topPercent + '%' }"
          >
            {{ tick.label }}
          </span>
        </div>
        <div class="plotCol">
          <div ref="plot" class="plot" @mousemove="onMove">
            <svg
              class="svg"
              :viewBox="`0 0 ${width} ${height}`"
              preserveAspectRatio="none"
            >
              <line
                v-for="(tick, index) in yTicks"
                :key="'g-' + index"
                class="grid"
                :x1="0"
                :x2="width"
                :y1="tick.y"
                :y2="tick.y"
              />
              <polyline
                v-for="series in seriesPlotted"
                :key="'line-' + series.teamId"
                class="line"
                fill="none"
                :points="series.linePoints"
                :stroke="series.color"
              />
              <line
                v-if="hoverPoint"
                class="crosshair"
                :x1="hoverPoint.x"
                :x2="hoverPoint.x"
                :y1="0"
                :y2="height"
                :stroke="hoverPoint.color"
              />
              <circle
                v-for="point in flatPlotted"
                :key="point.key"
                class="dot"
                :class="{
                  active: hoverKey === point.key,
                  hollow: point.pending,
                }"
                :cx="point.x"
                :cy="point.y"
                :r="dotRadius(point)"
                :fill="point.pending ? 'transparent' : point.color"
                :stroke="point.pending ? point.color : '#fff'"
              />
            </svg>
            <div
              v-if="hoverPoint"
              class="tooltip"
              :style="tooltipStyle"
            >
              <div class="tooltipPartner" :style="{ color: hoverPoint.color }">
                {{ hoverPoint.partnerLabel }}
              </div>
              <div class="tooltipElo">
                <template v-if="hoverPoint.pending">{{ pendingLabel }}</template>
                <template v-else>
                  {{ formatElo(hoverPoint.elo) }}
                  <span
                    v-if="hoverDelta != null && hoverDelta !== 0"
                    class="tooltipDelta"
                    :class="hoverDelta > 0 ? 'up' : 'down'"
                  >{{ hoverDelta > 0 ? '+' : '' }}{{ formatElo(hoverDelta) }}</span>
                </template>
              </div>
              <div class="tooltipDate">{{ formatDate(hoverPoint.createdAt) }}</div>
            </div>
          </div>
          <div class="xAxis">
            <span
              v-for="(tick, index) in xTicks"
              :key="'x-' + index"
              class="xLabel"
              :class="tick.align"
              :style="{ left: tick.leftPercent + '%' }"
            >
              {{ tick.label }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="legendItems.length" class="legend">
        <span
          v-for="item in legendItems"
          :key="item.teamId"
          class="legendItem"
        >
          <span class="legendDot" :style="{ background: item.color, borderColor: item.color }" />
          <span>{{ item.label }}</span>
        </span>
        <span v-if="pendingCount" class="legendItem">
          <span class="legendDot hollow" />
          <span>{{ pendingLabel }}</span>
        </span>
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { formatElo } from "@/badminton/formatElo.js";
import { colorForSeriesKey } from "@/badminton/ratingHistory.js";

const WIDTH = 1000;
const HEIGHT = 360;
const PAD = { top: 36, right: 40, bottom: 18, left: 28 };

function isRated(point) {
  return point != null && point.elo != null && Number.isFinite(Number(point.elo));
}

function partnerLabel(point) {
  if (!point) return "";
  const name = point.partnerName || "";
  const username = point.partnerUsername ? `@${point.partnerUsername}` : "";
  if (name && username) return `${name} (${username})`;
  return name || username || point.teamId || "—";
}

export default defineComponent({
  name: "DoublesRatingHistoryChart",
  props: {
    points: { type: Array, default: () => [] },
    emptyText: { type: String, default: "" },
    pendingLabel: { type: String, default: "—" },
  },
  data() {
    return {
      width: WIDTH,
      height: HEIGHT,
      hoverKey: null,
    };
  },
  computed: {
    hasPoints() {
      return this.flatPlotted.length > 0;
    },
    pendingCount() {
      return this.flatPlotted.filter((point) => point.pending).length;
    },
    seriesMeta() {
      const map = new Map();
      for (const point of this.points || []) {
        if (!point?.teamId || map.has(point.teamId)) continue;
        map.set(point.teamId, {
          teamId: point.teamId,
          color: colorForSeriesKey(point.teamId),
          label: partnerLabel(point),
        });
      }
      return [...map.values()];
    },
    legendItems() {
      return this.seriesMeta;
    },
    layout() {
      const points = Array.isArray(this.points) ? this.points : [];
      if (!points.length) {
        return { flat: [], series: [], minElo: 1200, maxElo: 1200 };
      }

      const ratedElos = points.filter(isRated).map((point) => Number(point.elo));
      let minElo = ratedElos.length ? Math.min(...ratedElos) : 1200;
      let maxElo = ratedElos.length ? Math.max(...ratedElos) : 1200;
      if (minElo === maxElo) {
        minElo -= 16;
        maxElo += 16;
      } else {
        const pad = Math.max((maxElo - minElo) * 0.18, 8);
        minElo -= pad;
        maxElo += pad;
      }

      const innerWidth = this.width - PAD.left - PAD.right;
      const innerHeight = this.height - PAD.top - PAD.bottom;
      const eloSpan = maxElo - minElo;
      const pendingY = this.height - PAD.bottom;
      const lastIndex = Math.max(points.length - 1, 1);
      const colorByTeam = new Map(this.seriesMeta.map((item) => [item.teamId, item.color]));

      const flat = points.map((point, index) => {
        const pending = !isRated(point);
        const elo = pending ? null : Number(point.elo);
        const x = PAD.left + (index / lastIndex) * innerWidth;
        const y = pending
          ? pendingY
          : PAD.top + (1 - (elo - minElo) / eloSpan) * innerHeight;
        const color = colorByTeam.get(point.teamId) || colorForSeriesKey(point.teamId);
        return {
          ...point,
          key: `${point.teamId}:${point.matchId}:${index}`,
          index,
          x,
          y,
          elo,
          pending,
          color,
          partnerLabel: partnerLabel(point),
          leftPercent: (x / this.width) * 100,
          topPercent: (y / this.height) * 100,
        };
      });

      const byTeam = new Map();
      for (const point of flat) {
        if (!byTeam.has(point.teamId)) byTeam.set(point.teamId, []);
        byTeam.get(point.teamId).push(point);
      }

      const series = [...byTeam.entries()].map(([teamId, teamPoints]) => {
        const rated = teamPoints.filter((point) => !point.pending);
        return {
          teamId,
          color: teamPoints[0]?.color || colorForSeriesKey(teamId),
          points: teamPoints,
          linePoints: rated.map((point) => `${point.x},${point.y}`).join(" "),
        };
      });

      return { flat, series, minElo, maxElo };
    },
    flatPlotted() {
      return this.layout.flat;
    },
    seriesPlotted() {
      return this.layout.series;
    },
    hoverPoint() {
      if (this.hoverKey == null) return null;
      return this.flatPlotted.find((point) => point.key === this.hoverKey) || null;
    },
    hoverDelta() {
      if (!this.hoverPoint || this.hoverPoint.pending) return null;
      const series = this.seriesPlotted.find((item) => item.teamId === this.hoverPoint.teamId);
      if (!series) return null;
      const rated = series.points.filter((point) => !point.pending);
      const index = rated.findIndex((point) => point.key === this.hoverPoint.key);
      if (index <= 0) return null;
      return this.hoverPoint.elo - rated[index - 1].elo;
    },
    tooltipStyle() {
      if (!this.hoverPoint) return {};
      const left = Math.min(Math.max(this.hoverPoint.leftPercent, 16), 84);
      const nearTop = this.hoverPoint.topPercent < 22;
      const top = nearTop
        ? Math.min(this.hoverPoint.topPercent + 10, 72)
        : Math.max(this.hoverPoint.topPercent - 10, 10);
      return {
        left: `${left}%`,
        top: `${top}%`,
        transform: nearTop ? "translate(-50%, 12%)" : "translate(-50%, -115%)",
      };
    },
    yTicks() {
      if (!this.flatPlotted.length) return [];
      const { minElo, maxElo } = this.layout;
      const values = [maxElo, (minElo + maxElo) / 2, minElo];
      const eloSpan = maxElo - minElo;
      const innerHeight = this.height - PAD.top - PAD.bottom;
      return values.map((value) => {
        const y = PAD.top + (1 - (value - minElo) / eloSpan) * innerHeight;
        return {
          y,
          label: formatElo(value),
          topPercent: (y / this.height) * 100,
        };
      });
    },
    xTicks() {
      if (!this.flatPlotted.length) return [];
      const last = this.flatPlotted.length - 1;
      const indexes = last === 0
        ? [0]
        : last === 1
          ? [0, 1]
          : [0, Math.round(last / 2), last];
      return indexes.map((index, tickIndex) => {
        const point = this.flatPlotted[index];
        const sameDay = this.dayKey(this.flatPlotted[0].createdAt)
          === this.dayKey(this.flatPlotted[last].createdAt);
        const label = sameDay
          ? this.formatAxisTime(point.createdAt)
          : this.formatAxisDate(point.createdAt);
        const align = tickIndex === 0 ? "start" : tickIndex === indexes.length - 1 ? "end" : "center";
        return {
          label,
          leftPercent: point.leftPercent,
          align,
        };
      });
    },
  },
  methods: {
    formatElo,
    dotRadius(point) {
      const active = this.hoverKey === point.key;
      if (point.pending) return active ? 5 : 3.5;
      return active ? 6 : 4.5;
    },
    clearHover() {
      this.hoverKey = null;
    },
    onMove(event) {
      if (!this.flatPlotted.length || !this.$refs.plot) return;
      const rect = this.$refs.plot.getBoundingClientRect();
      const ratioX = (event.clientX - rect.left) / rect.width;
      const ratioY = (event.clientY - rect.top) / rect.height;
      const svgX = ratioX * this.width;
      const svgY = ratioY * this.height;
      let bestKey = null;
      let bestDistance = Infinity;
      this.flatPlotted.forEach((point) => {
        const dx = point.x - svgX;
        const dy = point.y - svgY;
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestKey = point.key;
        }
      });
      this.hoverKey = bestKey;
    },
    dayKey(dateStr) {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return "";
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    },
    formatDate(dateStr) {
      if (!dateStr) return "—";
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleString(this.$i18n?.locale === "en" ? "en-GB" : "ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    formatAxisDate(dateStr) {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleDateString(this.$i18n?.locale === "en" ? "en-GB" : "ru-RU", {
        day: "2-digit",
        month: "short",
      });
    },
    formatAxisTime(dateStr) {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleTimeString(this.$i18n?.locale === "en" ? "en-GB" : "ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
});
</script>

<style scoped>
.chartRoot {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
.chartBody {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 8px;
  align-items: stretch;
  max-width: 100%;
  min-width: 0;
}
.yAxis {
  position: relative;
  min-height: 320px;
}
.yLabel {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: #7a76a8;
  white-space: nowrap;
}
.plotCol {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.plot {
  position: relative;
  width: 100%;
  height: 320px;
  border-radius: 16px;
  background:
    radial-gradient(ellipse 80% 55% at 50% 0%, rgba(79, 61, 255, 0.10), transparent 70%),
    linear-gradient(180deg, #fafaff 0%, #f3f2ff 100%);
  border: 1px solid rgba(79, 61, 255, 0.14);
  overflow: hidden;
  cursor: crosshair;
  box-sizing: border-box;
}
.svg {
  width: 100%;
  height: 100%;
  display: block;
}
.grid {
  stroke: rgba(79, 61, 255, 0.10);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.line {
  stroke-width: 3.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.dot {
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
  transition: r 0.12s ease;
}
.dot.hollow {
  fill: transparent;
  stroke-width: 2;
  stroke-dasharray: 2.5 2;
}
.dot.active {
  stroke: #fff;
}
.dot.hollow.active {
  fill: rgba(79, 61, 255, 0.12);
  stroke-dasharray: none;
}
.crosshair {
  stroke-width: 1.5;
  stroke-dasharray: 5 5;
  opacity: 0.35;
  vector-effect: non-scaling-stroke;
}
.xAxis {
  position: relative;
  height: 28px;
  margin: 0;
  padding: 0 4px;
  box-sizing: border-box;
  overflow: hidden;
}
.xLabel {
  position: absolute;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: #7a76a8;
  white-space: nowrap;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.xLabel.center { transform: translateX(-50%); }
.xLabel.start { left: 0 !important; transform: none; }
.xLabel.end { left: auto !important; right: 0; transform: none; }
.legend {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 13px;
  color: #7a76a8;
}
.legendItem {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.legendDot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid currentColor;
  box-sizing: border-box;
}
.legendDot.hollow {
  background: transparent;
  border-color: #9a92ff;
  border-style: dashed;
}
.empty {
  font-family: var(--font-display);
  opacity: 0.7;
  padding: 64px 20px;
  text-align: center;
}
.tooltip {
  position: absolute;
  pointer-events: none;
  background: #1c1a2e;
  color: #fff;
  border-radius: 14px;
  padding: 10px 14px;
  font-family: var(--font-display);
  box-shadow: 0 12px 28px rgba(40, 30, 120, 0.28);
  min-width: 120px;
  max-width: calc(100% - 24px);
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}
.tooltipPartner {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}
.tooltipElo {
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.tooltipDelta {
  font-size: 13px;
  font-weight: 700;
}
.tooltipDelta.up { color: #7dffa6; }
.tooltipDelta.down { color: #ff9b9b; }
.tooltipDate {
  font-size: 12px;
  opacity: 0.78;
  margin-top: 3px;
}

@media (max-width: 768px) {
  .chartBody {
    grid-template-columns: 40px minmax(0, 1fr);
  }
  .yAxis,
  .plot {
    min-height: 240px;
    height: 240px;
  }
}

@media (prefers-color-scheme: dark) {
  .plot {
    background:
      radial-gradient(ellipse 80% 55% at 50% 0%, rgba(79, 61, 255, 0.22), transparent 70%),
      linear-gradient(180deg, #2c2b36 0%, #24232d 100%);
    border-color: #454356;
  }
  .grid {
    stroke: rgba(255, 255, 255, 0.07);
  }
  .yLabel,
  .xLabel,
  .legend {
    color: #b8b5d0;
  }
  .tooltip {
    background: #12111a;
  }
}
</style>
