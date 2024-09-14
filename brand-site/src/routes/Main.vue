<template>
  <div className="contentDiv">
    <HeadBar :headItems="headItems"></HeadBar>
    <Description></Description>
    <ExperienceBar :items="experienceItems"></ExperienceBar>
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
          ref: '/',
          isMainSwitch: true
        },
        {
          text: 'Touch me',
          ref: '/contact',
          isMainSwitch: false
        },
        {
          text: 'Products',
          ref: '/products',
          isMainSwitch: false
        }
      ],
      experienceItems: [
        {
          date: '06.08.24-'+getDateNow(),
          text: 'Currently working at STM Labs \n' +
              'Working on a high-load service with a reactive stack (Spring Webflux) and advanced security (Spring Security and custom RPC framework) \n' +
              'Using clean-architecture to deal with legacy code and make it more readable and maintainable \n' +
              'Writing complex sql queries on jooq library \n'
        },
        {
          date: '02.04.24-05.07.24',
          text: 'I did an internship at Yandex: \n'+
              '- Added endpoints with new functionality, changed the behavior of legacy code and tested my implementation in pre-production, looked at traces and logs to find bugs \n'+
              '- Communicated with related teams to solve work problems \n'+
              '- Taught the balancers of the entire Yandex monitoring to ban shards, while maintaining the persistence of the cache and saving the state in Ydb \n'+
              '- Worked a lot with asynchronous code, actor systems and distributed architecture \n'
        }
      ]
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