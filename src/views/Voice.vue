<template>
  <div>

    <div id="login" v-if="loginInfo.showLoginArea">
      <el-input v-model="loginInfo.account" placeholder="请输入账号"/>
      <el-input v-model="loginInfo.password" placeholder="请输入密码"/>
      <el-button @click="login" id="loginBtn">登录</el-button>
    </div>

    <div id="funcBtns" v-if="!loginInfo.showLoginArea">
      <el-button @click="online">签入</el-button>
      <el-button @click="offline">签出</el-button>
      <el-button @click="logout">登出</el-button>
      <hr/>
      <el-input v-model="remoteNumber" placeholder="请输入要呼叫的号码"/>
      <el-button @click="call">拨号</el-button>

      <el-dialog
              center
              :visible.sync="showOutgoingCallDialog"
              width="30%">
        <span>正在呼叫 {{ remoteNumber }}</span>
        <span slot="footer" class="dialog-footer">
                <el-button @click="cancelCall">取消</el-button>
            </span>
      </el-dialog>

      <el-dialog
              center
              :visible.sync="showIncomingCallDialog"
              width="30%">
        <span>{{ remoteNumber }} 来话</span>
        <span slot="footer" class="dialog-footer">
                <el-button @click="accept">接受</el-button>
                <el-button @click="reject">拒绝</el-button>
            </span>
      </el-dialog>

    </div>

    <div id="video">
<!--      <video autoplay muted ref="localVideo"/>-->
<!--      <video autoplay ref="remoteVideo"/>-->
      <audio autoplay muted ref="localAudio"/>
      <audio autoplay ref="remoteAudio"/>

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
        loginInfo: {
          showLoginArea: true,
          account: '1010',
          password: '2345',
        },

        ua: null,

        session: null,
        remoteNumber: '1011',
        showOutgoingCallDialog: false,
        showIncomingCallDialog: false,
      }
    },
    methods: {
      login () {
        let config = {
          uri: `${this.loginInfo.account}@${freeSWITCHUserDomain}`,
          transportOptions: {
            wsServers: freeSWITCHWebSocketAddr,
            traceSip: true,
          },
          authorizationUser: this.loginInfo.account,
          password: this.loginInfo.password,
          register: false,
        }
        this.ua = new UA(config)

        // 调用 start() 连接到 WebSocket 服务器，但是不自动调用 register()
        this.ua.start()

        // 注册成功
        this.ua.on('registered', () => {
          this.$message.success('上线成功')
        })
        // 注册失败
        this.ua.on('registrationFailed', (response, cause) => {
          this.$message.error(`注册失败: ${response}`)
          console.error(`注册失败, response: ${response}, cause: ${cause}`)
        })
        // 下线成功
        this.ua.on('unregistered', (response, cause) => {
          this.$message.success('下线成功')
          console.log(`下线成功, response: ${response}, cause: ${cause}`)
        })

        // 通话邀请进来
        this.ua.on('invite', session => {
          console.log(session)
          this.session = session
          // this.remoteNumber = session.
          this.showIncomingCallDialog = true
        })

        // 隐藏登录框
        this.loginInfo.showLoginArea = false

        console.log('login...')
      },
      logout () {
        this.ua.stop()

        // 显示登录框
        this.loginInfo.showLoginArea = true

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
          if (!this.remoteNumber) {
            this.$message.warning('请输入要呼叫的号码')
            return
          }

          this.session = this.ua.invite(`${this.remoteNumber}@${freeSWITCHUserDomain}`, {
            sessionDescriptionHandlerOptions: {
              constraints: {
                audio: true,
                video: false,
              }
            }
          })

          this.showOutgoingCallDialog = true

          this.session.on('accepted', (data) => {
            this.$message.success('对方已接受')
            console.log(`对方已接受: ${data}`)

            this.showOutgoingCallDialog = false
          })
          this.session.on('rejected', (response, cause) => {
            this.$message.info('对方已拒绝')
            console.log(`对方已拒绝, response: ${response}, cause=${cause}`)

            this.showOutgoingCallDialog = false
          })

          this.session.on('failed', (response, cause) => {
            this.$message.error('呼叫失败')
            this.$message.info(`呼叫失败, response: ${response}, cause=${cause}`)

            this.showOutgoingCallDialog = false
          })

          this.session.on('bye', (request) => {
            this.$message.info('通话已结束')
            console.log(`通话已结束: ${request}`)
          })
          this.session.on('terminate', (message, cause) => {
            this.$message.info('通话已结束')
            console.log(`通话已结束,message : ${message}, cause=${cause}`)
          })

          this.session.on('trackAdded', () => {
            let pc = this.session.sessionDescriptionHandler.peerConnection

            // remoteStream
            let remoteStream = new MediaStream()
            pc.getReceivers().forEach((receiver) => {
              remoteStream.addTrack(receiver.track)
            })
            this.$refs.remoteAudio.srcObject = remoteStream

            // localStream
            let localStream = new MediaStream()
            pc.getSenders().forEach((sender) => {
              localStream.addTrack(sender.track)
            })
            this.$refs.localAudio.srcObject = localStream
          })

          console.log('invite...')
        } else {
          this.$message.warning('请先签入')
        }
      },
      cancelCall () {
        this.session.cancel()
        this.$message.info('通话已取消')

        this.showOutgoingCallDialog = false

        console.log('cancel...')
      },
      endCall () {
        if (this.session) {
          this.session.terminate()
          this.$message.info('通话已结束')

          console.log('terminate...')
        }
      },
      // -------------------------
      accept () {
        this.session.accept()
        this.$message.info('呼叫已接受')

        this.showIncomingCallDialog = false

        this.session.on('trackAdded', () => {
          let pc = this.session.sessionDescriptionHandler.peerConnection

          // remoteStream
          let remoteStream = new MediaStream()
          pc.getReceivers().forEach(receiver => {
            console.log(receiver)
            remoteStream.addTrack(receiver.track)
          })
          this.$refs.remoteAudio.srcObject = remoteStream

          // localStream
          let localStream = new MediaStream()
          pc.getSenders().forEach(sender => {
            localStream.addTrack(sender.track)
          })
          this.$refs.localAudio.srcObject = localStream
        })

        this.session.on('bye', (request) => {
          this.$message.info('通话已结束')
          console.log(`通话已结束: ${request}`)
        })
      },
      reject () {
        this.session.reject()
        this.$message.info('呼叫已拒绝')

        this.showIncomingCallDialog = false
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
