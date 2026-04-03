import fs from 'fs'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const filePath = './shadowshop.json'

export default {
  command: ['setstock', 'stock', 'delstock'],
  category: 'ventas',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (client, m, args, usedPrefix, command) => {
    const chatId = m.chat

    let ventas = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : {}

    if (!ventas[chatId]) ventas[chatId] = {}
    const prev = ventas[chatId].setstock || {}

    if (command === 'setstock') {
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
          `《✧》 Por favor, envía o responde a un texto o imagen para guardar el stock.\n✐ Ejemplo:\n> ${usedPrefix + command} Bot permanente: 5 soles.`
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

      ventas[chatId].setstock = {
        texto: texto || prev.texto || '',
        imagen: imagenBase64 ?? prev.imagen ?? null
      }

      fs.writeFileSync(filePath, JSON.stringify(ventas, null, 2))

      return m.reply('✅ Información de stock guardada correctamente para este grupo.')
    }

    if (command === 'stock') {
      const data = ventas[chatId]?.setstock

      if (!data || (!data.texto && !data.imagen)) {
        return m.reply(
          `⚠️ No hay información de stock guardada en este grupo.\n> Usa: *${usedPrefix}setstock* para guardar uno.`
        )
      }

      if (data.imagen) {
        const buffer = Buffer.from(data.imagen, 'base64')
        return client.sendMessage(m.chat, {
          image: buffer,
          caption: data.texto || '🔖 Información de stock'
        }, { quoted: m })
      }

      return m.reply(data.texto)
    }

    if (command === 'delstock') {
      if (!ventas[chatId]?.setstock) {
        return m.reply('⚠️ No hay información de stock para eliminar.')
      }

      delete ventas[chatId].setstock
      fs.writeFileSync(filePath, JSON.stringify(ventas, null, 2))

      return m.reply('🚮 Información de stock eliminada correctamente.')
    }
  },
}