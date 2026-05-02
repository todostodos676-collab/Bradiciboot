import syntaxerror from 'syntax-error'
import { format } from 'util'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

export default {
  command: ['ex', 'e'],
  category: 'owner',
  isOwner: true,
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!text || !text.trim()) {
      return client.reply(m.chat, '《✧》 Debes escribir un comando a ejecutar.', m)
    }

    let _text = (command === 'e' ? 'return ' : '') + text
    let old = m.exp || 0
    let _return, _syntax = ''

    try {
      if (m.react) await m.react('🕒')

      let i = 15
      let f = { exports: {} }

      let exec = new AsyncFunction(
        'print', 'm', 'client', 'require', 'Array', 'process', 'args', 'module', 'exports', 'argument',
        _text
      )

      _return = await exec.call(client, (...args) => {
        if (--i < 1) return
        return client.reply(m.chat, format(...args), m)
      }, m, client, require, Array, process, args, f, f.exports, [client])

      if (m.react) await m.react('✔️')

    } catch (e) {
      let err = syntaxerror(_text, 'Execution Function', {
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
        sourceType: 'module'
      })

      if (err) _syntax = '```' + err + '```\n\n'
      _return = e

      if (m.react) await m.react('✖️')
    } finally {
      client.reply(m.chat, _syntax + format(_return), m)
      m.exp = old
    }
  }
}