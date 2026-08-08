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
              <defs>
                <linearGradient id="eloArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#4F3DFF" stop-opacity="0.28" />
                  <stop offset="100%" stop-color="#4F3DFF" stop-opacity="0" />
                </linearGradient>
              </defs>
              <line
                v-for="(tick, index) in yTicks"
                :key="'g-' + index"
                class="grid"
                :x1="0"
                :x2="width"
                :y1="tick.y"
                :y2="tick.y"
              />
              <path v-if="areaPath" class="area" :d="areaPath" />
              <polyline
                v-if="linePoints"
                class="line"
                fill="none"
                :points="linePoints"
              />
              <line
                v-if="hoverPoint"
                class="crosshair"
                :x1="hoverPoint.x"
                :x2="hoverPoint.x"
                :y1="0"
                :y2="height"
              />
              <circle
                v-for="(point, index) in plotted"
                :key="point.matchId || index"
                class="dot"
                :class="{
                  active: hoverIndex === index,
                  hollow: point.pending,
                }"
                :cx="point.x"
                :cy="point.y"
                :r="point.pending ? (hoverIndex === index ? 4.5 : 3.5) : (hoverIndex === index ? 5.5 : 4)"
              />
            </svg>
            <div
              v-if="hoverPoint"
              class="tooltip"
              :style="tooltipStyle"
            >
              <div class="tooltipElo">
                {{ hoverPoint.pending ? pendingLabel : formatElo(hoverPoint.elo) }}
              </div>
              <div class="tooltipDate">{{ formatDate(hoverPoint.createdAt) }}</div>
            </div>
          </div>
          <div class="xAxis">
            <span
              v-for="(tick, index) in xTicks"
              :key="'x-' + index"
              class="xLabel"
              :style="{ left: tick.leftPercent + '%' }"
            >
              {{ tick.label }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="pendingCount" class="legend">
        <span class="legendDot hollow" />
        <span>{{ pendingLabel }}</span>
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { formatElo } from "@/badminton/formatElo.js";

const WIDTH = 1000;
const HEIGHT = 320;
const PAD = { top: 18, right: 12, bottom: 28, left: 8 };

function isRated(point) {
  return point != null && point.elo != null && Number.isFinite(Number(point.elo));
}

export default defineComponent({
  name: "RatingHistoryChart",
  props: {
    points: { type: Array, default: () => [] },
    emptyText: { type: String, default: "" },
    pendingLabel: { type: String, default: "—" },
  },
  data() {
    return {
      width: WIDTH,
      height: HEIGHT,
      hoverIndex: null,
    };
  },
  computed: {
    hasPoints() {
      return this.plotted.length > 0;
    },
    pendingCount() {
      return this.plotted.filter((point) => point.pending).length;
    },
    plotted() {
      const points = Array.isArray(this.points) ? this.points : [];
      if (!points.length) return [];

      const ratedElos = points.filter(isRated).map((point) => Number(point.elo));
      let minElo = ratedElos.length ? Math.min(...ratedElos) : 1200;
      let maxElo = ratedElos.length ? Math.max(...ratedElos) : 1200;
      if (minElo === maxElo) {
        minElo -= 12;
        maxElo += 12;
      } else {
        const pad = (maxElo - minElo) * 0.15;
        minElo -= pad;
        maxElo += pad;
      }

      const innerWidth = this.width - PAD.left - PAD.right;
      const innerHeight = this.height - PAD.top - PAD.bottom;
      const eloSpan = maxElo - minElo;
      const pendingY = this.height - PAD.bottom;
      const lastIndex = Math.max(points.length - 1, 1);

      return points.map((point, index) => {
        const pending = !isRated(point);
        const elo = pending ? null : Number(point.elo);
        const x = PAD.left + (index / lastIndex) * innerWidth;
        const y = pending
          ? pendingY
          : PAD.top + (1 - (elo - minElo) / eloSpan) * innerHeight;
        return {
          ...point,
          x,
          y,
          elo,
          pending,
          minElo,
          maxElo,
          leftPercent: (x / this.width) * 100,
          topPercent: (y / this.height) * 100,
        };
      });
    },
    ratedPlotted() {
      return this.plotted.filter((point) => !point.pending);
    },
    linePoints() {
      return this.ratedPlotted.map((point) => `${point.x},${point.y}`).join(" ");
    },
    areaPath() {
      const rated = this.ratedPlotted;
      if (rated.length < 2) return "";
      const baseline = this.height - PAD.bottom;
      const first = rated[0];
      const last = rated[rated.length - 1];
      const line = rated.map((point) => `${point.x} ${point.y}`).join(" L ");
      return `M ${first.x} ${baseline} L ${line} L ${last.x} ${baseline} Z`;
    },
    yTicks() {
      if (!this.plotted.length) return [];
      const { minElo, maxElo } = this.plotted[0];
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
      if (!this.plotted.length) return [];
      const last = this.plotted.length - 1;
      const indexes = last === 0 ? [0] : [0, Math.round(last / 2), last];
      const seen = new Set();
      return indexes.map((index) => {
        const point = this.plotted[index];
        let label = this.formatAxisDate(point.createdAt);
        if (seen.has(label) && index > 0) {
          label = this.formatAxisDateTime(point.createdAt);
        }
        seen.add(label);
        return {
          leftPercent: point.leftPercent,
          label,
        };
      });
    },
    hoverPoint() {
      if (this.hoverIndex == null) return null;
      return this.plotted[this.hoverIndex] || null;
    },
    tooltipStyle() {
      if (!this.hoverPoint) return {};
      const left = Math.min(Math.max(this.hoverPoint.leftPercent, 8), 78);
      const top = Math.max(this.hoverPoint.topPercent - 14, 4);
      return {
        left: `${left}%`,
        top: `${top}%`,
      };
    },
  },
  methods: {
    formatElo,
    clearHover() {
      this.hoverIndex = null;
    },
    onMove(event) {
      if (!this.plotted.length || !this.$refs.plot) return;
      const rect = this.$refs.plot.getBoundingClientRect();
      const ratioX = (event.clientX - rect.left) / rect.width;
      const svgX = ratioX * this.width;
      let bestIndex = 0;
      let bestDistance = Infinity;
      this.plotted.forEach((point, index) => {
        const distance = Math.abs(point.x - svgX);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      this.hoverIndex = bestIndex;
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
        month: "2-digit",
      });
    },
    formatAxisDateTime(dateStr) {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleString(this.$i18n?.locale === "en" ? "en-GB" : "ru-RU", {
        day: "2-digit",
        month: "2-digit",
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
}
.chartBody {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 8px;
  align-items: stretch;
}
.yAxis {
  position: relative;
  min-height: 280px;
}
.yLabel {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  color: #6b6b8a;
  white-space: nowrap;
}
.plotCol {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.plot {
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(79, 61, 255, 0.06), transparent 42%),
    #f7f7ff;
  border: 1px solid #e6e6ff;
  overflow: hidden;
}
.svg {
  width: 100%;
  height: 100%;
  display: block;
}
.grid {
  stroke: rgba(79, 61, 255, 0.12);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.area {
  fill: url(#eloArea);
}
.line {
  stroke: #4f3dff;
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.dot {
  fill: #4f3dff;
  stroke: #fff;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}
.dot.hollow {
  fill: transparent;
  stroke: #9a92ff;
  stroke-width: 2;
  stroke-dasharray: 2.5 2;
}
.dot.active {
  fill: #2f1fd0;
}
.dot.hollow.active {
  fill: rgba(79, 61, 255, 0.15);
  stroke: #4f3dff;
  stroke-dasharray: none;
}
.crosshair {
  stroke: #4f3dff;
  stroke-width: 1;
  stroke-dasharray: 4 4;
  opacity: 0.35;
  vector-effect: non-scaling-stroke;
}
.xAxis {
  position: relative;
  height: 22px;
}
.xLabel {
  position: absolute;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  color: #6b6b8a;
  white-space: nowrap;
}
.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-family: var(--font-display);
  font-size: 13px;
  color: #6b6b8a;
}
.legendDot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #9a92ff;
  border-style: dashed;
}
.empty {
  font-family: var(--font-display);
  opacity: 0.7;
  padding: 48px 20px;
  text-align: center;
}
.tooltip {
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -110%);
  background: rgba(24, 24, 36, 0.94);
  color: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  font-family: var(--font-display);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  min-width: 108px;
  z-index: 2;
}
.tooltipElo {
  font-weight: 700;
  font-size: 16px;
}
.tooltipDate {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

@media (prefers-color-scheme: dark) {
  .plot {
    background:
      linear-gradient(180deg, rgba(79, 61, 255, 0.16), transparent 48%),
      #2a2a32;
    border-color: #3d3d4a;
  }
  .grid {
    stroke: rgba(255, 255, 255, 0.08);
  }
  .yLabel,
  .xLabel,
  .legend {
    color: #b8b8c8;
  }
  .dot {
    stroke: #2a2a32;
  }
  .dot.hollow {
    stroke: #a59dff;
  }
  .tooltip {
    background: rgba(12, 12, 18, 0.96);
  }
}
</style>
