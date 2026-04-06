import fs from 'fs'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const filePath = './documentos.json'

export default {
  command: ['setdocumentos', 'documentos', 'deldocumentos'],
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
    const prev = dataBase[chatId].setdocumentos || {}

    if (command === 'setdocumentos') {
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
          `《✧》 Por favor, envía o responde a un texto o imagen para guardar los documentos.\n✐ Ejemplo:\n> ${usedPrefix + command} Documento básico: 8 soles.`
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

      dataBase[chatId].setdocumentos = {
        texto: texto || prev.texto || '',
        imagen: imagenBase64 ?? prev.imagen ?? null
      }

      fs.writeFileSync(filePath, JSON.stringify(dataBase, null, 2))

      return m.reply('✅ Información de documentos guardada correctamente para este grupo.')
    }

    if (command === 'documentos') {
      const data = dataBase[chatId]?.setdocumentos

      if (!data || (!data.texto && !data.imagen)) {
        return m.reply(
          `⚠️ No hay información de documentos guardada en este grupo.\n> Usa: *${usedPrefix}setdocumentos* para guardar una.`
        )
      }

      if (data.imagen) {
        const buffer = Buffer.from(data.imagen, 'base64')
        return client.sendMessage(m.chat, {
          image: buffer,
          caption: data.texto || '🔖 Información de documentos'
        }, { quoted: m })
      }

      return m.reply(data.texto)
    }

    if (command === 'deldocumentos') {
      if (!dataBase[chatId]?.setdocumentos) {
        return m.reply('⚠️ No hay información de documentos para eliminar.')
      }

      delete dataBase[chatId].setdocumentos
      fs.writeFileSync(filePath, JSON.stringify(dataBase, null, 2))

      return m.reply('🚮 Información de documentos eliminada correctamente.')
    }
  },
}