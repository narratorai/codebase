import clsx from 'clsx'

interface Props {
  children: React.ReactNode
  isExpanded?: boolean
  sidebar: React.ReactNode
}

const SidebarLayout = ({ children, isExpanded = true, sidebar }: Props) => (
  <div className="relative isolate flex min-h-svh w-full flex-col bg-gray-900 print:bg-white">
    <div
      className={clsx(
        'dark fixed inset-y-0 left-0 transition-all duration-300 ease-in-out print:hidden',
        isExpanded ? 'w-64' : 'w-[76px] sm:w-[68px]'
      )}
    >
      {sidebar}
    </div>

    <main
      className={clsx(
        'flex min-w-0 flex-1 flex-col py-2 pr-2 transition-all duration-300 ease-in-out print:my-6 print:!p-0',
        isExpanded ? 'pl-64' : 'pl-[76px] sm:pl-[68px]'
      )}
    >
      <div className="h-[calc(100vh-16px)] grow rounded-lg bg-white shadow-sm ring-1 ring-gray-950/5 print:h-full print:shadow-none print:ring-0">
        {children}
      </div>
    </main>
  </div>
)

export default SidebarLayout
