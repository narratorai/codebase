/* eslint-disable react/jsx-max-depth */
// sentry/react here so we can enable the react profiler, which is not available through sentry/nextjs
// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App, ConfigProvider, Layout } from 'antd-next'
import ChatPage from 'components/Chat/ChatPage'
import EnsureAuthenticated from 'components/context/auth/EnsureAuthenticated'
import { OnboardedRoute } from 'components/context/auth/protectedComponents'
import AuthProvider from 'components/context/auth/Provider'
import CompanyProvider from 'components/context/company/Provider'
import GraphProvider from 'components/context/graph/Provider'
import UserProvider from 'components/context/user/Provider'
import ErrorBoundary from 'components/ErrorBoundary'
import MaintenanceGate from 'components/MaintenanceGate'
import SideNavbar from 'components/Navbar/SideNavbar'
import NotFoundPage from 'components/NotFoundPage'
import IntroModal from 'components/Onboarding/IntroModal'
import OnboardingProvider from 'components/Onboarding/OnboardingProvider'
import TermsBanner from 'components/Onboarding/TermsBanner'
import PreventBack from 'components/PreventBack'
import { CenteredLoader } from 'components/shared/icons/Loader'
import StatusPageNotification from 'components/StatusPageNotification'
import React, { Suspense } from 'react'
import { BrowserRouter as Router, Switch } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { rebassTheme, zIndex } from 'util/constants'
import Route from 'util/route'

import { GlobalStyle } from './GlobalStyle'

// Lazy load to keep out of main entrypoint
const LayoutProvider = React.lazy(
  () => import(/* webpackChunkName: "layout" */ 'components/shared/layout/LayoutProvider')
)
const BlockOverlayProvider = React.lazy(
  () => import(/* webpackChunkName: "block-overlay" */ 'components/BlockOverlay/BlockOverlayProvider')
)
const BlockOverlay = React.lazy(
  () => import(/* webpackChunkName: "block-overlay" */ 'components/BlockOverlay/BlockOverlay')
)

// Routes are dynamically imported to keep our entrypoint slim
// Be sure to give a chunkName magic comment to make debugging easier
const Home = React.lazy(() => import(/* webpackChunkName: "home" */ 'components/Home/Home'))
const Provisioning = React.lazy(() => import(/* webpackChunkName: "onboarding" */ 'components/Onboarding/Provisioning'))
const WelcomePage = React.lazy(() => import(/* webpackChunkName: "welcome-page" */ 'components/Home/WelcomePage'))
const OnboardingPage = React.lazy(
  () => import(/* webpackChunkName: "onboarding-page" */ 'components/Onboarding/OnboardingPage')
)
const CompanyArchived = React.lazy(
  () => import(/* webpackChunkName: "archived" */ 'components/Archived/CompanyArchived')
)
const CustomerJourneyPage = React.lazy(
  () => import(/* webpackChunkName: "customer-journey" */ 'components/CustomerJourney/CustomerJourneyPage')
)
const Narratives = React.lazy(() => import(/* webpackChunkName: "narratives" */ 'components/Narratives/Narratives'))
const Dashboards = React.lazy(
  () => import(/* webpackChunkName: "dashboards" */ 'components/Narratives/Dashboards/Dashboards')
)
const Datasets = React.lazy(() => import(/* webpackChunkName: "datasets" */ 'components/Datasets/Datasets'))
const Manage = React.lazy(() => import(/* webpackChunkName: "manage" */ 'components/Manage/Manage'))
const Activities = React.lazy(() => import(/* webpackChunkName: "activities" */ 'components/Activities/Activities'))
const TransformationsPage = React.lazy(
  () => import(/* webpackChunkName: "transformations" */ 'components/Transformations/TransformationsPage')
)
const Downloads = React.lazy(() => import(/* webpackChunkName: "downloads" */ 'components/Downloads/Downloads'))

const QueryEditorPage = React.lazy(
  () => import(/* webpackChunkName: "query-editor" */ 'components/QueryEditor/QueryEditorPage')
)

const LLMs = React.lazy(() => import(/* webpackChunkName: "llms" */ 'components/LLM/LLMs'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
})

type RootProps = {
  companySlug?: string
}

// eslint-disable-next-line max-lines-per-function
const Root = (props: RootProps) => {
  return (
    <ConfigProvider
      prefixCls="antd5"
      theme={{
        token: {
          fontFamily: '"Source Sans Pro", sans-serif',
          borderRadius: 4,
        },
        components: {
          Notification: {
            // keeps notifications above helpscout beacon and drawer mask
            zIndexPopup: zIndex.notification,
          },
        },
      }}
    >
      <App>
        <ThemeProvider theme={rebassTheme}>
          <QueryClientProvider client={queryClient}>
            <GlobalStyle />
            <Router>
              <ErrorBoundary>
                <Suspense fallback={null}>
                  <AuthProvider companySlug={props.companySlug}>
                    <GraphProvider>
                      <EnsureAuthenticated>
                        <UserProvider>
                          <MaintenanceGate>
                            <Switch>
                              <Route exact path="/" component={Home} />
                              <Route exact path="/welcome" component={WelcomePage} />
                              <CompanyProvider>
                                <TermsBanner />
                                <Switch>
                                  <Route exact path="/:company_slug/onboarding" component={OnboardingPage} />
                                  <OnboardingProvider>
                                    <Route path="/:company_slug">
                                      <StatusPageNotification />
                                      <LayoutProvider>
                                        <PreventBack>
                                          <BlockOverlayProvider>
                                            <Layout
                                              id="layoutRoot"
                                              style={{ minHeight: '100vh', background: 'transparent' }}
                                            >
                                              <IntroModal />
                                              <SideNavbar id="sideNav" />
                                              {/* set overflow-x to `initial` so that
                                          position: sticky works properly */}
                                              <Layout.Content id="layoutContent" style={{ overflowX: 'initial' }}>
                                                <BlockOverlay />
                                                <Suspense fallback={<CenteredLoader id="layout-suspense-loader" />}>
                                                  <Switch>
                                                    <OnboardedRoute
                                                      // further permissions applied in <Manage />
                                                      path="/:company_slug/manage"
                                                      component={Manage}
                                                    />

                                                    <OnboardedRoute
                                                      path="/:company_slug/transformations"
                                                      component={TransformationsPage}
                                                    />

                                                    <OnboardedRoute
                                                      path="/:company_slug/activities"
                                                      component={Activities}
                                                    />

                                                    <OnboardedRoute
                                                      path="/:company_slug/narratives"
                                                      component={Narratives}
                                                    />

                                                    <OnboardedRoute
                                                      path="/:company_slug/dashboards"
                                                      component={Dashboards}
                                                    />

                                                    <OnboardedRoute
                                                      path="/:company_slug/customer_journey"
                                                      component={CustomerJourneyPage}
                                                    />

                                                    <OnboardedRoute path="/:company_slug/chat" component={ChatPage} />

                                                    <OnboardedRoute path="/:company_slug/llms" component={LLMs} />

                                                    <OnboardedRoute
                                                      path="/:company_slug/datasets"
                                                      component={Datasets}
                                                    />

                                                    <OnboardedRoute
                                                      exact
                                                      path="/:company_slug/query_editor"
                                                      adminOnly
                                                      component={QueryEditorPage}
                                                    />

                                                    {/* Loading state for provisioning resources */}
                                                    <Route
                                                      exact
                                                      path="/:company_slug/provisioning"
                                                      component={Provisioning}
                                                    />

                                                    {/* Route for Archived companies */}
                                                    <Route
                                                      exact
                                                      path="/:company_slug/archived"
                                                      component={CompanyArchived}
                                                    />

                                                    <Route
                                                      path="/:company_slug/downloads/:encoded_file"
                                                      component={Downloads}
                                                    />

                                                    {/* Handle company root redirect */}
                                                    <Route exact path="/:company_slug" component={Home} />
                                                    <Route component={NotFoundPage} />
                                                  </Switch>
                                                </Suspense>
                                              </Layout.Content>
                                            </Layout>
                                          </BlockOverlayProvider>
                                        </PreventBack>
                                      </LayoutProvider>
                                    </Route>
                                  </OnboardingProvider>
                                </Switch>
                              </CompanyProvider>
                            </Switch>
                          </MaintenanceGate>
                        </UserProvider>
                      </EnsureAuthenticated>
                    </GraphProvider>
                  </AuthProvider>
                </Suspense>
              </ErrorBoundary>
            </Router>
          </QueryClientProvider>
        </ThemeProvider>
      </App>
    </ConfigProvider>
  )
}

// https://github.com/getsentry/sentry-javascript/tree/master/packages/react#profiler
export default Sentry.withProfiler(Root)
