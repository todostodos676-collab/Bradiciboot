import { getBuffer } from '../../lib/message.js'

export default {
  command: ['wpgrupos', 'gruposwa', 'wagrupos'],
  category: 'internet',
  run: async (client, m, args, command) => {
    if (!args || !args[0]) {
      return m.reply(
        '《✧》 Por favor, ingrese una categoría.\n\n' +
        'Ejemplo:\n' +
        '• .wpgrupos amistad'
      )
    }

    try {
      const lastArg = args[args.length - 1]
      const hasLimit = !isNaN(lastArg)

      const limite = hasLimit
        ? Math.min(Math.max(parseInt(lastArg, 10), 1), 20)
        : 10

      const categoria = hasLimit
        ? args.slice(0, -1).join(' ').toLowerCase()
        : args.join(' ').toLowerCase()

      const api = `${global.APIs.axi.url}/search/wpgrupos?categoria=${encodeURIComponent(categoria)}&limite=${limite}`
      const res = await fetch(api)
      const json = await res.json()

      if (!json?.status || !json?.resultado?.grupos?.length) {
        return m.reply(`《✧》 Lo sentimos, no se encontraron grupos para la categoría *${categoria}*.`)
      }

      const grupos = json.resultado.grupos.filter(v => v.estado === 'ok' && v.enlace)

      if (!grupos.length) {
        return m.reply(`《✧》 Se encontraron resultados en *${categoria}*, pero ninguno tiene enlace disponible.`)
      }

      const thumb = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png'
      const thumbnail = await getBuffer(thumb)

      let teks = `➩ *Grupos de WhatsApp encontrados*\n\n`
      teks += `> ❖ *Categoría ›* ${json.resultado.categoria || categoria}\n`
      teks += `> ✿ *Total API ›* ${json.resultado.total || grupos.length}\n`
      teks += `> ⴵ *Mostrando ›* ${grupos.length}\n\n`

      teks += grupos.map((v, i) => {
        return (
          `➩ *${i + 1}. ${v.nombre}*\n` +
          `> ❖ *País ›* ${v.pais || 'No especificado'}\n` +
          `> ✿ *Categoría ›* ${v.categoria || categoria}\n` +
          `> ⴵ *Estado ›* ${v.estado}\n` +
          `> ❒ *Url ›* ${v.enlace}`
        ).trim()
      }).join('\n\n╾۪〬─ ┄۫╌ ׄ┄┈۪ ─〬 ׅ┄╌ ۫┈ ─ׄ─۪〬 ┈ ┄۫╌ ┈┄۪ ─ׄ〬╼\n\n')

      await client.sendMessage(
        m.chat,
        {
          text: teks,
          contextInfo: {
            externalAdReply: {
              title: 'Group WhatsApp Search',
              body: ``,
              mediaType: 1,
              renderLargerThumbnail: true,
              showAdAttribution: false,
              thumbnail,
              sourceUrl: ``
            }
          }
        },
        { quoted: m }
      )
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  },
}