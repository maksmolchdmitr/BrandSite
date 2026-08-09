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
                <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#4F3DFF" stop-opacity="0.22" />
                  <stop offset="55%" stop-color="#4F3DFF" stop-opacity="0.06" />
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
              <path v-if="areaPath" class="area" :d="areaPath" :fill="`url(#${gradientId})`" />
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
                :r="dotRadius(point, index)"
              />
            </svg>
            <div
              v-if="hoverPoint"
              class="tooltip"
              :style="tooltipStyle"
            >
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
const HEIGHT = 360;
const PAD = { top: 22, right: 16, bottom: 12, left: 8 };

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
      gradientId: `eloArea-${Math.random().toString(36).slice(2, 9)}`,
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
      const indexes = last === 0
        ? [0]
        : last === 1
          ? [0, 1]
          : [0, Math.round(last / 2), last];
      const dayKeys = indexes.map((index) => this.dayKey(this.plotted[index].createdAt));
      return indexes.map((index, tickIndex) => {
        const point = this.plotted[index];
        const sameDayAsPrev = tickIndex > 0 && dayKeys[tickIndex] === dayKeys[tickIndex - 1];
        const align = tickIndex === 0 ? "start" : tickIndex === indexes.length - 1 ? "end" : "center";
        return {
          leftPercent: point.leftPercent,
          align,
          label: sameDayAsPrev
            ? this.formatAxisTime(point.createdAt)
            : this.formatAxisDate(point.createdAt),
        };
      });
    },
    hoverPoint() {
      if (this.hoverIndex == null) return null;
      return this.plotted[this.hoverIndex] || null;
    },
    hoverDelta() {
      if (!this.hoverPoint || this.hoverPoint.pending || this.hoverIndex == null) return null;
      for (let i = this.hoverIndex - 1; i >= 0; i -= 1) {
        const prev = this.plotted[i];
        if (!prev.pending && prev.elo != null) {
          return this.hoverPoint.elo - prev.elo;
        }
      }
      return null;
    },
    tooltipStyle() {
      if (!this.hoverPoint) return {};
      const left = Math.min(Math.max(this.hoverPoint.leftPercent, 12), 88);
      const top = Math.max(this.hoverPoint.topPercent - 12, 6);
      return {
        left: `${left}%`,
        top: `${top}%`,
      };
    },
  },
  methods: {
    formatElo,
    dotRadius(point, index) {
      const active = this.hoverIndex === index;
      if (point.pending) return active ? 5 : 3.5;
      return active ? 6 : 4.5;
    },
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
}
.chartBody {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
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
  stroke: #4f3dff;
  stroke-width: 3.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.dot {
  fill: #4f3dff;
  stroke: #fff;
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
  transition: r 0.12s ease;
}
.dot.hollow {
  fill: transparent;
  stroke: #9a92ff;
  stroke-width: 2;
  stroke-dasharray: 2.5 2;
}
.dot.active {
  fill: #2f1fd0;
  stroke: #fff;
}
.dot.hollow.active {
  fill: rgba(79, 61, 255, 0.18);
  stroke: #4f3dff;
  stroke-dasharray: none;
}
.crosshair {
  stroke: #4f3dff;
  stroke-width: 1.5;
  stroke-dasharray: 5 5;
  opacity: 0.28;
  vector-effect: non-scaling-stroke;
}
.xAxis {
  position: relative;
  height: 24px;
  margin: 0 4px;
}
.xLabel {
  position: absolute;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: #7a76a8;
  white-space: nowrap;
}
.xLabel.center { transform: translateX(-50%); }
.xLabel.start { transform: translateX(0); }
.xLabel.end { transform: translateX(-100%); }
.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 13px;
  color: #7a76a8;
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
  padding: 64px 20px;
  text-align: center;
}
.tooltip {
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -115%);
  background: #1c1a2e;
  color: #fff;
  border-radius: 14px;
  padding: 10px 14px;
  font-family: var(--font-display);
  box-shadow: 0 12px 28px rgba(40, 30, 120, 0.28);
  min-width: 120px;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  .dot {
    stroke: #2c2b36;
  }
  .dot.hollow {
    stroke: #a59dff;
  }
  .tooltip {
    background: #12111a;
  }
}
</style>
