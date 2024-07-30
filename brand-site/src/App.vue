<template>
  <div className="contentDiv">
    <div className="headBar">
      <TextRef :item="mainLogoItem"></TextRef>
      <SwitchBar className="switchBar" :items="headItems"></SwitchBar>
    </div>
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

export default {
  components: {
    TextRef,
    SwitchBar,
    Description,
    ExperienceBar,
    DateSwitch
  },
  data() {
    return {
      mainLogoItem: {
        text: 'MaksMolch',
        ref: 'http://localhost:5173/',
        isMainSwitch: true
      },
      headItems: [
        {
          text: 'Main',
          ref: 'http://localhost:5173/',
          isMainSwitch: true
        },
        {
          text: 'Touch me',
          ref: 'http://localhost:5173/contact',
          isMainSwitch: false
        },
        {
          text: 'Products',
          ref: 'http://localhost:5173/products',
          isMainSwitch: false
        }
      ],
      experienceItems: [
        {
          date: '02.04.24-05.07.24',
          text: 'I did an internship at Yandex:\n'+
              '- Added endpoints with new functionality, changed the behavior of legacy code and tested my implementation in pre-production, looked at traces and logs to find bugs\n'+
              '- Communicated with related teams to solve work problems\n'+
              '- Taught the balancers of the entire Yandex monitoring to ban shards, while maintaining the persistence of the cache and saving the state in Ydb\n'+
              '- Worked a lot with asynchronous code, actor systems and distributed architecture.'
        },
        {
          date: '02.04.24-05.07.24',
          text: 'I did an internship at Yandex:\n'+
              '- Added endpoints with new functionality, changed the behavior of legacy code and tested my implementation in pre-production, looked at traces and logs to find bugs\n'+
              '- Communicated with related teams to solve work problems\n'+
              '- Taught the balancers of the entire Yandex monitoring to ban shards, while maintaining the persistence of the cache and saving the state in Ydb\n'+
              '- Worked a lot with asynchronous code, actor systems and distributed architecture.'
        },
        {
          date: '02.04.24-05.07.24',
          text: 'I did an internship at Yandex:\n'+
              '- Added endpoints with new functionality, changed the behavior of legacy code and tested my implementation in pre-production, looked at traces and logs to find bugs\n'+
              '- Communicated with related teams to solve work problems\n'+
              '- Taught the balancers of the entire Yandex monitoring to ban shards, while maintaining the persistence of the cache and saving the state in Ydb\n'+
              '- Worked a lot with asynchronous code, actor systems and distributed architecture.'
        },
        {
          date: '02.04.24-05.07.24',
          text: 'I did an internship at Yandex:\n'+
              '- Added endpoints with new functionality, changed the behavior of legacy code and tested my implementation in pre-production, looked at traces and logs to find bugs\n'+
              '- Communicated with related teams to solve work problems\n'+
              '- Taught the balancers of the entire Yandex monitoring to ban shards, while maintaining the persistence of the cache and saving the state in Ydb\n'+
              '- Worked a lot with asynchronous code, actor systems and distributed architecture.'
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
.headBar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  padding: 50px;
  background-color: white;
}

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

  .switchItem {
    font-size: 12px;
  }

  .contentDiv {
    gap: 12px;
  }

  .headBar {
    padding: 20px;
  }
}
</style>