<template>
  <div>

    <div id="login" v-if="showLoginArea">
      <el-input v-model="account" placeholder="请输入账号"/>
      <el-input v-model="password" placeholder="请输入密码"/>
      <el-button @click="login" id="loginBtn">登录</el-button>
    </div>

    <div id="funcBtns" v-if="!showLoginArea">
      <el-button @click="online">签入</el-button>
      <el-button @click="offline">签出</el-button>
      <el-button @click="logout">登出</el-button>
      <hr/>
      <el-input v-model="destNumber" placeholder="请输入要呼叫的号码"/>
      <el-button @click="call">拨号</el-button>

      <el-dialog
              center
              :visible.sync="outgoingCalling"
              width="30%">
        <span>正在呼叫 {{ destNumber }}</span>
        <span slot="footer" class="dialog-footer">
                <el-button @click="cancelCall">取消</el-button>
            </span>
      </el-dialog>

      <el-dialog
              center
              :visible.sync="incomingCalling"
              width="30%">
        <span>{{ destNumber }} 来话</span>
        <span slot="footer" class="dialog-footer">
                <el-button @click="accept">接受</el-button>
                <el-button @click="reject">拒绝</el-button>
            </span>
      </el-dialog>

    </div>

    <div id="video" v-show="showVideo">
      <video id="localVideo" autoplay muted ref="localVideo"/>
      <video id="remoteVideo" autoplay ref="remoteVideo"/>

      <el-button @click="endCall" id="endCallBtn">挂断</el-button>
    </div>

  </div>
</template>

<script>
  import { UA } from 'sip.js'
  import { freeSWITCHUserDomain, freeSWITCHWebSocketAddr } from '../config'

  export default {
    name: 'sip',
    data () {
      return {
        showVideo: false,

        showLoginArea: true,
        account: '',
        password: '',
        ua: null,

        destNumber: '',
        outgoingCalling: false,
        session: null,

        incomingCalling: false,
      }
    },
    methods: {
      login () {
        let config = {
          uri: `${this.account}@${freeSWITCHUserDomain}`,
          transportOptions: {
            wsServers: freeSWITCHWebSocketAddr,
            traceSip: true,
          },
          authorizationUser: this.account,
          password: this.password,
          register: false,
        }
        // this.ua = new SIP.UA(config)
        this.ua = new UA(config)

        // 调用 start() 连接到 WebSocket 服务器，但是不自动调用 register()
        this.ua.start()

        // 注册成功后触发
        this.ua.on('registered', () => {
          this.$message.success('上线成功')
        })

        this.ua.on('registrationFailed', (response, cause) => {
          this.$message.error(`注册失败: ${response}`)
          console.error(`注册失败, response: ${response}, cause: ${cause}`)
        })
        this.ua.on('unregistered', (response, cause) => {
          this.$message.error('下线成功')
          console.error(`下线成功, response: ${response}, cause: ${cause}`)
        })
        this.ua.on('invite', session => {
          this.session = session
          this.incomingCalling = true
        })

        this.showLoginArea = false

        console.log('login...')
      },
      logout () {
        this.ua.stop()

        this.showLoginArea = true

        console.log('logout...')
      },
      online () {
        this.ua.register()

        console.log('online...')
      },
      offline () {
        this.ua.unregister()

        console.log('offline...')
      },

      // -------------------------
      call () {
        if (this.ua.isRegistered()) {
          if (!this.destNumber) {
            this.$message.warning('请输入要呼叫的号码')
            return
          }

          this.session = this.ua.invite(`${this.destNumber}@${freeSWITCHUserDomain}`, {
            sessionDescriptionHandlerOptions: {
              constraints: {
                audio: true,
                video: false,
              }
            }
          })

          this.session.on('accepted', (data) => {
            this.$message.success('对方已接受')
            console.log(`对方已接受: ${data}`)

            this.showVideo = true
          })
          this.session.on('rejected', (response, cause) => {
            this.$message.info('对方已拒绝')
            console.log(`对方已拒绝, response: ${response}, cause=${cause}`)
          })

          this.session.on('failed', (response, cause) => {
            this.$message.error('呼叫失败')
            this.$message.info(`呼叫失败, response: ${response}, cause=${cause}`)
          })

          this.session.on('bye', (request) => {
            this.$message.info('通话已结束')
            console.log(`通话已结束: ${request}`)

            this.showVideo = false
          })

          this.session.on('trackAdded', () => {
            let pc = this.session.sessionDescriptionHandler.peerConnection

            // remoteStream
            let remoteStream = new MediaStream()
            pc.getReceivers().forEach((receiver) => {
              remoteStream.addTrack(receiver.track)
            })
            this.$refs.remoteVideo.srcObject = remoteStream
            // this.$refs.remoteVideo.play()

            // localStream
            let localStream = new MediaStream()
            pc.getSenders().forEach((sender) => {
              localStream.addTrack(sender.track)
            })
            this.$refs.localVideo.srcObject = localStream
            // this.$refs.localVideo.play()
          })

          this.outgoingCalling = true

          console.log('invite...')
        } else {
          this.$message.warning('请先签入')
        }
      },
      cancelCall () {
        this.session.cancel()
        this.$message.info('通话已取消')

        this.outgoingCalling = false

        console.log('cancel...')
      },
      endCall () {
        this.session.terminate()
        this.$message.info('通话已结束')

        console.log('terminate...')
      },
      // -------------------------
      accept () {
        this.session.accept()
        this.$message.info('呼叫已接受')

        this.incomingCalling = false

        this.showVideo = true

        this.session.on('trackAdded', () => {
          let pc = this.session.sessionDescriptionHandler.peerConnection

          // remoteStream
          let remoteStream = new MediaStream()
          pc.getReceivers().forEach((receiver) => {
            remoteStream.addTrack(receiver.track)
          })
          this.$refs.remoteVideo.srcObject = remoteStream
          // this.$refs.remoteVideo.play()

          // localStream
          let localStream = new MediaStream()
          pc.getSenders().forEach((sender) => {
            localStream.addTrack(sender.track)
          })
          this.$refs.localVideo.srcObject = localStream
          // this.$refs.localVideo.play()
        })

        this.session.on('bye', (request) => {
          this.$message.info('通话已结束')
          console.log(`通话已结束: ${request}`)

          this.showVideo = false
        })
      },
      reject () {
        this.session.reject()
        this.$message.info('呼叫已拒绝')

        this.incomingCalling = false
      },
    }
  }

</script>

<style lang="scss">
  #login {
    width: 200px;
    height: 200px;

    #loginBtn {
      margin-top: 6px;
    }
  }

  #video {
    display: flex;

    #endCallBtn {
      margin-top: 12px;
    }
  }
</style>
