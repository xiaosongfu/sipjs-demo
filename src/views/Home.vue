<!--<template>-->
<!--  <div>-->
<!--    <video ref="remoteVideo"></video>-->
<!--    <video ref="localVideo" muted="muted"></video>-->

<!--    <hr/>-->

<!--    <button @click="login">登录</button>-->
<!--    |-->
<!--    <button @click="call">呼叫</button>-->
<!--    |-->
<!--    <button @click="hangup">挂断</button>-->
<!--  </div>-->
<!--</template>-->

<!--<script>-->
<!--  import { freeSWITCHServerAddr, freeSWITCHWebSocketAddr } from '@/config'-->

<!--  export default {-->
<!--    name: 'login',-->
<!--    data () {-->
<!--      return {-->
<!--        userID: '1010',-->
<!--        password: '1234',-->
<!--        ua: null,-->
<!--        simple: null,-->
<!--      }-->
<!--    },-->
<!--    methods: {-->
<!--      login () {-->
<!--        const config = {-->
<!--          uri: `1010@${freeSWITCHServerAddr}`,-->
<!--          ws_server: freeSWITCHWebSocketAddr,-->
<!--          authorizationUser: this.userID,-->
<!--          password: this.password,-->
<!--        }-->

<!--        this.ua = new SIP.UA(config)-->

<!--        // -&ndash;&gt;-->
<!--        const options = {-->
<!--          media: {-->
<!--            local: {-->
<!--              video: this.$refs.localVideo,-->
<!--            },-->
<!--            remote: {-->
<!--              video: this.$refs.remoteVideo,-->
<!--              // This is necessary to do an audio/video call as opposed to just a video call-->
<!--              audio: this.$refs.remoteVideo,-->
<!--            },-->
<!--          },-->
<!--          ua: this.ua,-->
<!--        }-->

<!--        this.simple = SIP.Web.Simple(options)-->

<!--        // // -&ndash;&gt;-->
<!--        // this.simple.on('ringing', () => {-->
<!--        //   this.simple.answer()-->
<!--        //   // this.simple.hangup()-->
<!--        // })-->
<!--      },-->
<!--      call () {-->
<!--        this.simple.call(`1001@${freeSWITCHServerAddr}`)-->
<!--      },-->
<!--      hangup () {-->
<!--        this.simple.hangup()-->
<!--      },-->
<!--    },-->

<!--  }-->
<!--</script>-->

<!--<style scoped lang="sass">-->

<!--</style>-->


<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'home',
  components: {
    HelloWorld
  }
}
</script>
