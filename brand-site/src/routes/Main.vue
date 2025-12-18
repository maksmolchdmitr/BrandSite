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
      ],
      experienceItems: [
        {
          date: '05.03.25-' + getDateNow(),
          text: `Came to work in *Yandex*
Synchronise data from different tables with Yson using YQL queries.
Migrating project to a new version of JUnit, Java and Spring boot for the internal framework
`
        },
        {
          date: '06.08.24-27.02.25',
          text: `Worked at *STM Labs*
- Worked on a high-load service with a reactive stack (Spring Webflux) and advanced security (Spring Security and custom RPC framework)
- Used clean-architecture to deal with legacy code and make it more readable and maintainable
- Wrote complex SQL queries using the jOOQ library
- Added dynamic and customizable validators through configuration
`
        },
        {
          date: '02.04.24-05.07.24',
          text: `I did an internship at *Yandex*:
- Added endpoints with new functionality, changed the behavior of legacy code and tested my implementation in pre-production, looked at traces and logs to find bugs
- Communicated with related teams to solve work problems
- Taught the balancers of the entire Yandex monitoring to ban shards, while maintaining the persistence of the cache and saving the state in Ydb
- Worked a lot with asynchronous code, actor systems and distributed architecture
`
        },
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
      return text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
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
