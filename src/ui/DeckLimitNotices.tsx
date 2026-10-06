/**
 * 卡组限制没通过时的提示。背包使用、卡组管理和进入秘境共用这一块。
 *
 * @param props.messages 要显示的句子。空的时候不占位置
 * @returns 提示列表
 */
export function DeckLimitNotices({ messages }: { messages: readonly string[] }) {
  if (messages.length === 0) return null
  return (
    <div className="mb-3 flex flex-col gap-2">
      {messages.map((text) => (
        <p key={text} className="rounded-lg bg-[#f4efe6] px-3 py-2 text-sm font-semibold text-[#241f1a]" role="status">
          {text}
        </p>
      ))}
    </div>
  )
}
