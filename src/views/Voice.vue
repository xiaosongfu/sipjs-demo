<template>
  <div>

  </div>
</template>

<script>
  export default {
    name: 'sip',
    data() {
      return {
        userID: '',
        password: '',
        ua: null,
      }
    },
    methods: {
      login() {
        const config = {

        }

        this.ua = new SIP.UA(config)
      }
    }
  }

</script>

<style scoped lang="sass">

</style>
