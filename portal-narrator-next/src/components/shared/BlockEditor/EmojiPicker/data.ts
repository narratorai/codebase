import { EmojiMartData } from '@emoji-mart/data'
import data from '@emoji-mart/data/sets/1/native.json' // Note that this is about 206KB

const categories = (data as EmojiMartData).categories
const emojis = (data as EmojiMartData).emojis

export { categories, emojis }
