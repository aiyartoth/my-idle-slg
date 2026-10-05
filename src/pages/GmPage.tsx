import { useState, type FormEvent } from 'react'
import { findCardByName } from '../data/cardCatalog'
import { addCardToBag } from '../data/player'

/**
 * GM 页。按卡牌名字发一张到背包，同名牌会叠在一起。
 *
 * @returns GM 页
 */
export default function GmPage() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const card = findCardByName(name)
    if (!card) {
      setMessage('没有这张卡')
      return
    }
    addCardToBag(card)
    setMessage(`已获得 ${card.name}`)
  }
  return (
    <div className="px-4 py-4">
      <h1 className="text-lg font-semibold">GM</h1>
      <form className="mt-4" onSubmit={onSubmit}>
        <label className="block text-sm text-[#c8b49a]" htmlFor="gm-card-name">
          卡牌名字
        </label>
        <input
          id="gm-card-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-lg bg-[#2a241f] px-3 py-2 text-base text-[#f4efe6]"
          autoComplete="off"
        />
        <button type="submit" className="mt-3 rounded-lg bg-[#f4efe6] px-3 py-2 text-sm font-semibold text-[#241f1a]">
          获取
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-[#e6c36a]">{message}</p> : null}
    </div>
  )
}
