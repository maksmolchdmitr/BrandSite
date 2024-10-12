<template>
  <div className="dateSwitcher">
    <div v-for="i in Array(dateData.count).fill().map((_, idx) => idx)" :key="i">
      <div className="dateBlock" v-if="i === dateData.number">
        <a :id="'date_' + dateData.number" className="dateText">{{ dateData.text }}</a>
      </div>
      <div v-else>
        <a :href="'#date_' + i">
          <img className="circleSwitcher" src="@/assets/DateFromButton.svg"  alt="Another date link">
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    dateData: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.dateSwitcher {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 16px;
}

.dateText {
  font-family: 'Mali', 'sans-serif';
  font-size: 24px;
  color: black;
}

.dateBlock {
  height: 32px;
  width: fit-content;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 100px;
  background-color: #D9D9D9;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .dateSwitcher {
    gap: 8px;
  }

  .dateText {
    font-size: 16px;
  }

  .dateBlock {
    height: 24px;
  }

  .circleSwitcher {
    height: 24px;
    width: 24px;
  }
}
</style>