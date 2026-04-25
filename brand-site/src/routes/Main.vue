<template>
  <div className="contentDiv">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>
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
      experienceItems: [
        {
          date: '05.03.25-' + getDateNow(),
          textKey: 'main.experiences.first'
        },

        {
          date: '06.08.24-27.02.25',
          textKey: 'main.experiences.second'
        },

        {
          date: '02.04.24-05.07.24',
          textKey: 'main.experiences.third'
        },

        {
          date: '09.2024-06.2025',
          textKey: 'main.experiences.fourth'
        }
      ]
    }
  },
  computed: {
    localizedHeadItems() {
      return [
        { text: this.$t('common.nav.main'), ref: '/?page=main', isMainSwitch: true },
        { text: this.$t('common.nav.touchMe'), ref: '/?page=contact', isMainSwitch: false },
        { text: this.$t('common.nav.products'), ref: '/?page=products', isMainSwitch: false },
      ];
    },
    formattedExperienceItems() {
      return this.experienceItems.map(item => {
        return {
          ...item,
          text: this.formatText(this.$t(item.textKey))
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

<style scoped>
.contentDiv {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 64px;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
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
