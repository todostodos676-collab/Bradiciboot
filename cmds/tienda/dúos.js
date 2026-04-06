import fs from 'fs'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const filePath = './duos.json'

export default {
  command: ['setduos', 'duos', 'delduos'],
  category: 'ventas',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (client, m, args, usedPrefix, command) => {
    const chatId = m.chat

    let dataBase = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : {}

    if (!dataBase[chatId]) dataBase[chatId] = {}
    const prev = dataBase[chatId].setduos || {}

    if (command === 'setduos') {
      const text = args.join(' ').trim()

      const quoted = m.quoted
      const directImage = m.msg?.mimetype?.startsWith('image/')
      const quotedImage = quoted?.mimetype?.startsWith('image/')

      const texto =
        text ||
        m.text?.replace(new RegExp(`^${usedPrefix}${command}`, 'i'), '').trim() ||
        quoted?.text ||
        quoted?.caption ||
        ''

      if (!texto && !directImage && !quotedImage) {
        return m.reply(
          `《✧》 Por favor, envía o responde a un texto o imagen para guardar los dúos.\n✐ Ejemplo:\n> ${usedPrefix + command} Dúo premium: 15 soles.`
        )
      }

      let imagenBase64 = null

      try {
        if (quotedImage) {
          const stream = await downloadContentFromMessage(quoted.msg, 'image')
          let buffer = Buffer.alloc(0)
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }
          imagenBase64 = buffer.toString('base64')
        } else if (directImage) {
          const stream = await downloadContentFromMessage(m.msg, 'image')
          let buffer = Buffer.alloc(0)
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }
          imagenBase64 = buffer.toString('base64')
        }
      } catch (e) {
        console.error('Error descargando imagen:', e)
      }

      dataBase[chatId].setduos = {
        texto: texto || prev.texto || '',
        imagen: imagenBase64 ?? prev.imagen ?? null
      }

      fs.writeFileSync(filePath, JSON.stringify(dataBase, null, 2))

      return m.reply('✅ Información de dúos guardada correctamente para este grupo.')
    }

    if (command === 'duos') {
      const data = dataBase[chatId]?.setduos

      if (!data || (!data.texto && !data.imagen)) {
        return m.reply(
          `⚠️ No hay información de dúos guardada en este grupo.\n> Usa: *${usedPrefix}setduos* para guardar una.`
        )
      }

      if (data.imagen) {
        const buffer = Buffer.from(data.imagen, 'base64')
        return client.sendMessage(m.chat, {
          image: buffer,
          caption: data.texto || '🔖 Información de dúos'
        }, { quoted: m })
      }

      return m.reply(data.texto)
    }

    if (command === 'delduos') {
      if (!dataBase[chatId]?.setduos) {
        return m.reply('⚠️ No hay información de dúos para eliminar.')
      }

      delete dataBase[chatId].setduos
      fs.writeFileSync(filePath, JSON.stringify(dataBase, null, 2))

      return m.reply('🚮 Información de dúos eliminada correctamente.')
    }
  },
}