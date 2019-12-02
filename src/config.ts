export let freeSWITCHServerAddr = '192.168.160.46';
export let freeSWITCHWebSocketAddr = 'ws://192.168.160.46:5066';

if (process.env.NODE_ENV === 'production') {
  freeSWITCHServerAddr = '192.168.160.46';
  freeSWITCHWebSocketAddr = 'wss://192.168.160.46:7443'
}
