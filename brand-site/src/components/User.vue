<template>
  <div className="user">
    <button @click="deleteUserFunc(index)">{{ $t('common.actions.delete') }}</button>
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
  </div>
</template>

<script>
  export default {
    props: {
      user: {
        type: Object,
        required: true
      },
      index: {
        type: Number,
        required: true
      },
      deleteUserFunc: {
        type: Function,
        required: true
      }
    }
  }
</script>

<style scoped>

</style>