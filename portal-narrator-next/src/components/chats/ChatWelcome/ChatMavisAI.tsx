import MavisIcon from 'static/mavis/icons/logo.svg'

const ChatMavisAI = () => (
  <div className="mb-12 space-y-7 p-10 text-center">
    <div className="inline-block rounded-full p-4 shadow bordered-gray-100">
      <MavisIcon className="size-14" />
    </div>
    <div className="space-y-2">
      <h1 className="text-4xl">Welcome to Mavis AI</h1>
      <p className="text-sm text-gray-400">
        Mavis is designed to be your personal AI data analyst that answers your questions
      </p>
    </div>
  </div>
)

export default ChatMavisAI
