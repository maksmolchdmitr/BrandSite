<template>
  <div class="chartWrap" @mouseleave="clearHover">
    <svg
      v-if="hasPoints"
      class="chart"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      @mousemove="onMove"
    >
      <line
        v-for="(tick, index) in yTicks"
        :key="'y-' + index"
        class="grid"
        :x1="padding.left"
        :x2="width - padding.right"
        :y1="tick.y"
        :y2="tick.y"
      />
      <polyline
        v-if="linePoints"
        class="line"
        fill="none"
        :points="linePoints"
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
        :r="hoverIndex === index ? 5 : 3.5"
      />
      <line
        v-if="hoverPoint"
        class="crosshair"
        :x1="hoverPoint.x"
        :x2="hoverPoint.x"
        :y1="padding.top"
        :y2="height - padding.bottom"
      />
      <text
        v-for="(tick, index) in yTicks"
        :key="'yl-' + index"
        class="axisLabel"
        :x="padding.left - 8"
        :y="tick.y + 4"
        text-anchor="end"
      >
        {{ tick.label }}
      </text>
      <text
        v-for="(tick, index) in xTicks"
        :key="'xl-' + index"
        class="axisLabel"
        :x="tick.x"
        :y="height - 10"
        text-anchor="middle"
      >
        {{ tick.label }}
      </text>
    </svg>
    <div v-else class="empty">{{ emptyText }}</div>
    <div
      v-if="hoverPoint"
      class="tooltip"
      :style="{ left: tooltipLeft + 'px', top: tooltipTop + 'px' }"
    >
      <div class="tooltipElo">
        {{
          hoverPoint.pending
            ? pendingLabel
            : formatElo(hoverPoint.elo)
        }}
      </div>
      <div class="tooltipDate">{{ formatDate(hoverPoint.createdAt) }}</div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { formatElo } from "@/badminton/formatElo.js";

const WIDTH = 640;
const HEIGHT = 260;

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
      padding: { top: 16, right: 16, bottom: 36, left: 48 },
      hoverIndex: null,
    };
  },
  computed: {
    hasPoints() {
      return this.plotted.length > 0;
    },
    plotted() {
      const points = Array.isArray(this.points) ? this.points : [];
      if (!points.length) return [];

      const times = points.map((point) => new Date(point.createdAt).getTime());
      const ratedElos = points
        .filter(isRated)
        .map((point) => Number(point.elo));
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const timeSpan = Math.max(maxTime - minTime, 1);

      let minElo = ratedElos.length ? Math.min(...ratedElos) : 1200;
      let maxElo = ratedElos.length ? Math.max(...ratedElos) : 1200;
      if (minElo === maxElo) {
        minElo -= 10;
        maxElo += 10;
      } else {
        const pad = (maxElo - minElo) * 0.12;
        minElo -= pad;
        maxElo += pad;
      }
      const eloSpan = maxElo - minElo;
      const innerWidth = this.width - this.padding.left - this.padding.right;
      const innerHeight = this.height - this.padding.top - this.padding.bottom;
      const pendingY = this.height - this.padding.bottom;

      return points.map((point, index) => {
        const time = times[index];
        const pending = !isRated(point);
        const elo = pending ? null : Number(point.elo);
        const x = this.padding.left + ((time - minTime) / timeSpan) * innerWidth;
        const y = pending
          ? pendingY
          : this.padding.top + (1 - (elo - minElo) / eloSpan) * innerHeight;
        return {
          ...point,
          x,
          y,
          elo,
          pending,
          minElo,
          maxElo,
          minTime,
          maxTime,
        };
      });
    },
    linePoints() {
      return this.plotted
        .filter((point) => !point.pending)
        .map((point) => `${point.x},${point.y}`)
        .join(" ");
    },
    yTicks() {
      if (!this.plotted.length) return [];
      const { minElo, maxElo } = this.plotted[0];
      const values = [minElo, (minElo + maxElo) / 2, maxElo];
      const innerHeight = this.height - this.padding.top - this.padding.bottom;
      return values.map((value) => {
        const y =
          this.padding.top + (1 - (value - minElo) / (maxElo - minElo)) * innerHeight;
        return { y, label: formatElo(value) };
      });
    },
    xTicks() {
      if (!this.plotted.length) return [];
      const { minTime, maxTime } = this.plotted[0];
      const mid = minTime + (maxTime - minTime) / 2;
      const innerWidth = this.width - this.padding.left - this.padding.right;
      return [minTime, mid, maxTime].map((time, index) => ({
        x: this.padding.left + (index / 2) * innerWidth,
        label: this.formatAxisDate(time),
      }));
    },
    hoverPoint() {
      if (this.hoverIndex == null) return null;
      return this.plotted[this.hoverIndex] || null;
    },
    tooltipLeft() {
      if (!this.hoverPoint) return 0;
      return Math.min(Math.max(this.hoverPoint.x - 40, 8), this.width - 120);
    },
    tooltipTop() {
      if (!this.hoverPoint) return 0;
      return Math.max(this.hoverPoint.y - 56, 8);
    },
  },
  methods: {
    formatElo,
    clearHover() {
      this.hoverIndex = null;
    },
    onMove(event) {
      if (!this.plotted.length) return;
      const rect = event.currentTarget.getBoundingClientRect();
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
    formatAxisDate(ms) {
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleDateString(this.$i18n?.locale === "en" ? "en-GB" : "ru-RU", {
        day: "2-digit",
        month: "2-digit",
      });
    },
  },
});
</script>

<style scoped>
.chartWrap {
  position: relative;
  width: 100%;
  min-height: 260px;
}
.chart {
  width: 100%;
  height: 260px;
  display: block;
  background: #fafaff;
  border-radius: 12px;
}
.grid {
  stroke: #e8e8ff;
  stroke-width: 1;
}
.line {
  stroke: #4f3dff;
  stroke-width: 2.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.dot {
  fill: #4f3dff;
  stroke: #fff;
  stroke-width: 1.5;
}
.dot.hollow {
  fill: #fafaff;
  stroke: #4f3dff;
  stroke-width: 2;
}
.dot.active {
  fill: #2f1fd0;
}
.dot.hollow.active {
  fill: #ececff;
  stroke: #2f1fd0;
}
.crosshair {
  stroke: #4f3dff;
  stroke-width: 1;
  stroke-dasharray: 4 4;
  opacity: 0.45;
}
.axisLabel {
  fill: #6b6b8a;
  font-family: var(--font-display);
  font-size: 11px;
}
.empty {
  font-family: var(--font-display);
  opacity: 0.7;
  padding: 40px 20px;
  text-align: center;
}
.tooltip {
  position: absolute;
  pointer-events: none;
  background: #1f1f2e;
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-family: var(--font-display);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  min-width: 96px;
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
  .chart {
    background: #343434;
  }
  .grid {
    stroke: #4a4a4a;
  }
  .axisLabel {
    fill: #b8b8b8;
  }
  .dot.hollow {
    fill: #343434;
  }
  .dot.hollow.active {
    fill: #3a3a4a;
  }
  .tooltip {
    background: #111;
  }
}
</style>
