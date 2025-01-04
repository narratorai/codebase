'use client'

import { UserProvider } from '@auth0/nextjs-auth0/client'
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffectOnce } from 'react-use'

import MainMenu from '@/components/menu/MainMenu'
import { SidebarLayout } from '@/components/primitives/SidebarLayout'
import Notification from '@/components/shared/Notification'
import { useMenuExpandedPreference } from '@/hooks'
import { LaunchDarklyProvider } from '@/hooks/launchdarkly'
import { useCompany } from '@/stores/companies'
import { useUser } from '@/stores/users'
import { BeaconScripts } from '@/util/helpscout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
})

interface Props {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const getCompany = useCompany((state) => state.get)
  const getCurrentUserSeed = useUser((state) => state.getCurrentUserSeed)
  const [isExpanded, toggleExpanded] = useMenuExpandedPreference()

  useEffectOnce(() => {
    queryClient.prefetchQuery({ queryFn: () => getCompany('current'), queryKey: ['company'] })
    queryClient.prefetchQuery({ queryFn: () => getCurrentUserSeed(), queryKey: ['currentUserSeed'] }) // TODO: Pass the datacenterRegion from the getCompany call after completed migration.
  })

  return (
    <UserProvider>
      <LaunchDarklyProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BeaconScripts />

            <SidebarLayout
              isExpanded={isExpanded}
              sidebar={<MainMenu isExpanded={isExpanded} onExpandClick={toggleExpanded} />}
            >
              {children}
            </SidebarLayout>
            <Notification />
          </TooltipProvider>
        </QueryClientProvider>
      </LaunchDarklyProvider>
    </UserProvider>
  )
}
