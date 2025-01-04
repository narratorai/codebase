import Stepper from '@/components/shared/Stepper'

const ChatNews = () => (
  <div className="rounded-xl p-8 bordered-gray-100">
    <Stepper steps={3}>
      <div className="w-full space-y-2 px-4">
        <h5>Mavis is in beta</h5>
        <p className="text-sm text-gray-600">
          Our AI behaves like a data anlayst, it can answer data question, interpret the data, search customer journey
          and more.
        </p>
      </div>
      <div className="w-full space-y-2 px-4">
        <h5>Coming soon</h5>
        <p className="text-sm text-gray-600">
          We are adding a lot to the chat. Searching the web, remembering more information about you, and allowing
          uploads of files.
        </p>
      </div>
      <div className="w-full space-y-2 px-4">
        <h5>Feedback</h5>
        <p className="text-sm text-gray-600">
          Please let us know what you think. We are always looking for feedback to improve.
        </p>
      </div>
    </Stepper>
  </div>
)

export default ChatNews
