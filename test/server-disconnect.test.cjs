const assert = require('assert')
const WebSocket = require('ws')
const { startServer } = require('../server/index.cjs')

describe('server disconnect behavior', function() {
  this.timeout(5000)
  let srv
  let port

  before(async () => {
    srv = startServer(0) // random free port
    await new Promise(r => setTimeout(r, 50))
    port = srv.server.address().port
  })

  after(async () => {
    await srv.stop()
  })

  it('frees nickname on disconnect', async () => {
    // connect A and set nick
    const a = new WebSocket(`ws://127.0.0.1:${port}`)

    await new Promise((resolve, reject) => {
      a.on('open', () => {
        a.send(JSON.stringify({ type: 'set_nick', nick: 'tester' }))
      })
      a.on('message', (m) => {
        const msg = JSON.parse(m)
        if (msg.type === 'nick_ok') resolve()
      })
      a.on('error', reject)
    })

    // connect B and try to use same nick -> should receive nick_taken
    const b = new WebSocket(`ws://127.0.0.1:${port}`)
    const gotTaken = await new Promise((resolve, reject) => {
      b.on('open', () => { b.send(JSON.stringify({ type: 'set_nick', nick: 'tester' })) })
      b.on('message', (m) => {
        const msg = JSON.parse(m)
        if (msg.type === 'nick_taken') resolve(true)
      })
      b.on('error', reject)
      setTimeout(() => resolve(false), 400)
    })
    assert.strictEqual(gotTaken, true, 'expected nick_taken when nick already used')

    // close A, wait, then try again with C using same nick
    a.close()
    await new Promise(r => setTimeout(r, 300))

    const c = new WebSocket(`ws://127.0.0.1:${port}`)
    const gotOk = await new Promise((resolve, reject) => {
      c.on('open', () => { c.send(JSON.stringify({ type: 'set_nick', nick: 'tester' })) })
      c.on('message', (m) => {
        const msg = JSON.parse(m)
        if (msg.type === 'nick_ok') resolve(true)
        if (msg.type === 'nick_taken') resolve(false)
      })
      c.on('error', reject)
      setTimeout(() => resolve(false), 800)
    })

    assert.strictEqual(gotOk, true, 'expected to be able to register nick after disconnect')

    // cleanup
    try { b.close() } catch (e) {}
    try { c.close() } catch (e) {}
  })
})