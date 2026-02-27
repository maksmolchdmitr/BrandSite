<template>
  <div className="contentDiv">
    <HeadBar :headItems="headItems"></HeadBar>
    <Description></Description>
    <ExperienceBar :items="formattedExperienceItems"></ExperienceBar>
  </div>
</template>

<script>
import SwitchBar from "@/components/SwitchBar.vue";
import TextRef from "@/components/TextRef.vue";
import Description from "@/components/Decsription.vue";
import ExperienceBar from "@/components/ExperienceBar.vue";
import DateSwitch from "@/components/DateSwitch.vue";
import HeadBar from "@/components/HeadBar.vue";

export default {
  components: {
    HeadBar,
    TextRef,
    SwitchBar,
    Description,
    ExperienceBar,
    DateSwitch
  },
  data() {
    function getDateNow() {
      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    }

    return {
      headItems: [
        {
          text: 'Main',
          ref: '/?page=main',
          isMainSwitch: true
        },
        {
          text: 'Touch me',
          ref: '/?page=contact',
          isMainSwitch: false
        },
        {
          text: 'Products',
          ref: '/?page=products',
          isMainSwitch: false
        }
      ],experienceItems: [
        {
          date: '05.03.25-' + getDateNow(),
          text: `Joined *Yandex Market Ads* as a backend engineer.

Own full-cycle development of product and infrastructure features — from requirements clarification and API design to rollout, monitoring and on-call support in a high-load distributed environment.

Worked on CPM / CPA advertising systems, Game Center mechanics and bonus programs:
- Built and supported admin APIs, analytics exports (YT + Temporal workflows), billing & targeting integrations
- Migrated targeting logic from hardcoded rules to configuration-driven YT tables
- Improved observability through logging and workflow instrumentation
- Optimized latency and response time of critical endpoints
- Removed large volumes of legacy code, simplifying architecture and reducing technical debt

Key impact:
- Led rollout of new game mechanics to 100% of audience → DAU +350%, revenue +78%
- Built backend infrastructure for multi-creative campaigns, enabling bandit-based optimization (CTR +59.7%, CPC −37.4%)
- Delivered multiple bonus mechanics improving advertiser engagement and conversion rates
`
        },

        {
          date: '06.08.24-27.02.25',
          text: `Backend Engineer at *STM Labs* (B2G).

Developed and optimized high-load reactive services (Spring WebFlux + custom RPC framework).

- Integrated distributed tracing into internal RPC library, improving incident investigation
- Refactored legacy components using clean architecture principles
- Automated code quality validation and improved CI reliability
- Contributed to MapReduce-style large-scale data processing pipelines
- Participated in performance tuning and production incident analysis
`
        },

        {
          date: '02.04.24-05.07.24',
          text: `Backend Engineering Intern at *Yandex*.

- Implemented shard banning logic in monitoring balancers while preserving cache persistence in YDB
- Designed and implemented new endpoints; modified legacy services with full pre-production validation
- Worked extensively with asynchronous code, actor-based systems and distributed architecture
- Analyzed traces and logs to identify and resolve production-level issues
`
        },

        {
          date: '09.2024-06.2025',
          text: `Founder at *Random Walk*.

Led a cross-functional team (mobile, QA, design, backend).

- Designed and implemented a distributed WebSocket-based backend service
- Developed a dynamic GraphQL-based web platform
- Managed product lifecycle from ideation to production release

GitHub – https://github.com/ru-random-walk
`
        }
      ]
    }
  },
  computed: {
    formattedExperienceItems() {
      return this.experienceItems.map(item => {
        return {
          ...item,
          text: this.formatText(item.text)
        };
      });
    }
  },
  methods: {
    formatText(text) {
      return text
          // жирный текст
          .replace(/\*(.*?)\*/g, '<strong>$1</strong>')

          // автоматическое превращение ссылок в <a>
          .replace(
              /(https?:\/\/[^\s]+)/g,
              '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
          )

          // переносы строк
          .replace(/\n/g, '<br>');
    }
  }
}
</script>

<style>
body {
  background-color: #D9D9D9;
  margin: 0;
}
</style>

<style scoped>
.contentDiv {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 64px;
}

@media (max-width: 768px) {
  p {
    font-size: 24px;
  }

  .contentDiv {
    gap: 12px;
  }
}
</style>
